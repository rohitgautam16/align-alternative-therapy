// src/components/custom-ui/SongBulkUpload.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, X, FileAudio, Loader } from 'lucide-react';
import {
  useCreateAdminSongMutation,
} from '../../utils/api';

const SongBulkUpload = ({ 
  playlistId = null, 
  currentPlaylist = null,
  onComplete, 
  onClose 
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [completedUploads, setCompletedUploads] = useState([]);
  const [failedUploads, setFailedUploads] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  const [createSong] = useCreateAdminSongMutation();

  // ✅ Simple slug generation - backend handles uniqueness
  const generateSlug = (title) => {
    if (!title) return '';
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  // Get filename without extension as title
  const getFileTitle = (filename) => {
    return filename.replace(/\.[^/.]+$/, "");
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;

    // Filter only audio files
    const audioFiles = files.filter(file => file.type.startsWith('audio/'));

    const fileData = audioFiles.map((file, index) => {
      const title = getFileTitle(file.name);
      return {
        id: Date.now() + index,
        file,
        title,
        slug: generateSlug(title), // ✅ Simple slug, backend handles uniqueness
        size: file.size,
        status: 'pending',
        progress: 0,
        audioUrl: null,
        error: null,
        songData: null
      };
    });

    setSelectedFiles(fileData);
    setAllComplete(false);
    setCompletedUploads([]);
    setFailedUploads([]);
  };

  // Remove file from selection
  const removeFile = (fileId) => {
    setSelectedFiles(files => files.filter(f => f.id !== fileId));
  };

  // Clear all files
  const clearAllFiles = () => {
    setSelectedFiles([]);
    setCompletedUploads([]);
    setFailedUploads([]);
    setAllComplete(false);
  };

  // Start bulk upload process
  const startBulkUpload = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    setCompletedUploads([]);
    setFailedUploads([]);
    setAllComplete(false);

    // Process files sequentially
    for (const fileData of selectedFiles) {
      await processFileUpload(fileData);
    }

    setIsProcessing(false);
    setAllComplete(true);
    
    if (onComplete) onComplete();
  };

  // Process individual file upload
  const processFileUpload = async (fileData) => {
    try {
      updateFileStatus(fileData.id, { status: 'uploading', progress: 10 });

      // Get presigned URL
      const presignUrl = `http://localhost:3001/api/admin/r2/presign?filename=${encodeURIComponent(fileData.file.name)}&contentType=${encodeURIComponent(fileData.file.type)}&folder=audio%2Fsongs`;
      
      const presignResponse = await fetch(presignUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!presignResponse.ok) throw new Error('Failed to get upload URL');
      
      const presignData = await presignResponse.json();
      updateFileStatus(fileData.id, { progress: 20 });

      // Upload audio file to R2
      const uploadResponse = await uploadFileWithProgress(
        fileData.file, 
        presignData.url,
        (progress) => updateFileStatus(fileData.id, { progress: 20 + (progress * 0.6) })
      );

      if (!uploadResponse.ok) throw new Error('Audio upload failed');
      
      const audioUrl = `https://cdn.align-alternativetherapy.com/${presignData.key}`;
      updateFileStatus(fileData.id, { 
        status: 'creating', 
        progress: 85, 
        audioUrl 
      });

      // ✅ Create song record (backend handles slug uniqueness)
      const songData = {
        title: fileData.title,
        name: fileData.title,
        slug: fileData.slug, // Backend will make it unique
        artist: 'Align Alternative Therapy',
        tags: '',
        playlist: playlistId,
        category: null,
        artwork_filename: '',
        cdn_url: audioUrl,
      };

      const newSong = await createSong(songData).unwrap();
      
      // Mark as completed
      updateFileStatus(fileData.id, { 
        status: 'completed', 
        progress: 100, 
        songData: newSong 
      });

      setCompletedUploads(prev => [...prev, { ...fileData, songData: newSong }]);

    } catch (error) {
      console.error('Upload error:', error);
      updateFileStatus(fileData.id, { 
        status: 'error', 
        error: error.message 
      });

      setFailedUploads(prev => [...prev, { ...fileData, error: error.message }]);
    }
  };

  // Upload file with progress tracking
  const uploadFileWithProgress = (file, uploadUrl, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({ ok: true });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  // Update file status
  const updateFileStatus = (fileId, updates) => {
    setSelectedFiles(files => 
      files.map(f => f.id === fileId ? { ...f, ...updates } : f)
    );
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FileAudio size={16} className="text-gray-400" />;
      case 'uploading':
      case 'creating':
        return <Loader size={16} className="text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'error':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <FileAudio size={16} className="text-gray-400" />;
    }
  };

  // Get status text
  const getStatusText = (file) => {
    switch (file.status) {
      case 'pending':
        return `Ready • ${formatFileSize(file.size)}`;
      case 'uploading':
        return `Uploading audio... ${Math.round(file.progress)}%`;
      case 'creating':
        return 'Creating song...';
      case 'completed':
        return 'Song created successfully!';
      case 'error':
        return `Error: ${file.error}`;
      default:
        return 'Unknown status';
    }
  };

  // Retry failed uploads
  const retryFailedUploads = () => {
    const failedFiles = selectedFiles.filter(f => f.status === 'error');
    if (failedFiles.length > 0) {
      // Reset failed files to pending
      failedFiles.forEach(file => {
        updateFileStatus(file.id, { status: 'pending', progress: 0, error: null });
      });
      
      setFailedUploads([]);
      startBulkUpload();
    }
  };

  const totalFiles = selectedFiles.length;
  const completedCount = completedUploads.length;
  const failedCount = failedUploads.length;
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-4 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <Upload size={20} /> Bulk Upload Songs
          </h4>
          <p className="text-sm text-gray-400 mt-1">
            Upload multiple audio files at once
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
      </div>

      {/* Current Playlist Info */}
      {playlistId && currentPlaylist && (
        <div className="bg-gray-700 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <img
              src={currentPlaylist.image || currentPlaylist.artwork_filename}
              alt="Playlist"
              className="w-8 h-8 rounded object-cover flex-shrink-0"
              onError={(e) => {
                e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjNkI3MjgwIi8+CjxjaXJjbGUgY3g9IjE2IiBjeT0iMTYiIHI9IjgiIGZpbGw9IiM5Q0E0QUYiLz4KPC9zdmc+';
              }}
            />
            <div>
              <p className="text-sm text-white font-medium">{currentPlaylist.title}</p>
              <p className="text-xs text-blue-400">Songs will be added to this playlist</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {selectedFiles.length === 0 && (
        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
          <Upload size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-300 mb-2">Select audio files to upload</p>
          <p className="text-gray-500 text-sm mb-4">
            Multiple files supported. Songs will be created with:
          </p>
          <ul className="text-gray-500 text-sm text-left max-w-md mx-auto space-y-1">
            <li>• <strong>Title:</strong> Filename (without extension)</li>
            <li>• <strong>Artist:</strong> Align Alternative Therapy</li>
            <li>• <strong>Playlist:</strong> {playlistId ? 'Current playlist' : 'Can be selected'}</li>
            <li>• <strong>Tags & Artwork:</strong> Can be added later</li>
          </ul>
          
          <input
            type="file"
            multiple
            accept="audio/*"
            onChange={handleFileSelect}
            className="hidden"
            id="bulk-audio-upload"
            disabled={isProcessing}
          />
          <label
            htmlFor="bulk-audio-upload"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded cursor-pointer transition-colors"
          >
            <Upload size={16} />
            Choose Audio Files
          </label>
        </div>
      )}

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">
                {totalFiles} file{totalFiles !== 1 ? 's' : ''} selected • {formatFileSize(totalSize)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearAllFiles}
                disabled={isProcessing}
                className="text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 rounded"
              >
                Clear All
              </button>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
                id="bulk-audio-upload-more"
                disabled={isProcessing}
              />
              <label
                htmlFor="bulk-audio-upload-more"
                className={`text-sm px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer ${
                  isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add More
              </label>
              {!isProcessing && (
                <button
                  onClick={startBulkUpload}
                  className="text-sm px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded"
                >
                  Start Upload
                </button>
              )}
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2">
            {selectedFiles.map((file) => (
              <div key={file.id} className="bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(file.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate font-medium">
                      {file.title}
                    </p>
                    <p className="text-xs text-gray-400">
                      {getStatusText(file)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {file.status === 'uploading' || file.status === 'creating' ? (
                      <div className="w-16 bg-gray-600 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${file.progress}%` }}
                        />
                      </div>
                    ) : null}
                    
                    {file.status === 'pending' && !isProcessing && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="text-gray-400 hover:text-red-400 p-1"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Progress Summary */}
          {isProcessing && (
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Overall Progress</span>
                <span className="text-sm text-gray-300">
                  {completedCount} of {totalFiles} completed
                </span>
              </div>
              <div className="w-full bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${totalFiles > 0 ? (completedCount / totalFiles) * 100 : 0}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* ✅ Success Message */}
          {allComplete && completedCount > 0 && failedCount === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-900/20 border border-green-600 p-4 rounded-lg text-center"
            >
              <CheckCircle size={24} className="text-green-400 mx-auto mb-2" />
              <p className="text-green-400 font-medium">
                🎉 All {completedCount} songs uploaded successfully!
              </p>
              <p className="text-green-300 text-sm mt-1">
                You can now add tags and artwork individually if needed.
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded text-sm"
                >
                  Close & View Songs
                </button>
              </div>
            </motion.div>
          )}

          {/* ✅ Mixed Results Message */}
          {allComplete && completedCount > 0 && failedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-yellow-900/20 border border-yellow-600 p-4 rounded-lg"
            >
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={20} className="text-yellow-400" />
                <p className="text-yellow-400 font-medium">
                  Bulk Upload Completed with Some Issues
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p className="text-green-300">✅ {completedCount} songs uploaded successfully</p>
                <p className="text-red-300">❌ {failedCount} songs failed to upload</p>
              </div>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={retryFailedUploads}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  Retry Failed
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}

          {/* ✅ All Failed Message */}
          {allComplete && completedCount === 0 && failedCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-900/20 border border-red-600 p-4 rounded-lg text-center"
            >
              <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
              <p className="text-red-400 font-medium">
                All Uploads Failed
              </p>
              <p className="text-red-300 text-sm mt-1">
                {failedCount} song{failedCount !== 1 ? 's' : ''} failed to upload. Check your connection and try again.
              </p>
              <div className="flex justify-center gap-2 mt-3">
                <button
                  onClick={retryFailedUploads}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
                >
                  Retry All
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default SongBulkUpload;
