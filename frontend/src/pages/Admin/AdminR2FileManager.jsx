// src/pages/Admin/AdminR2FileManager.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  useListR2ObjectsQuery,
  useGetR2ObjectMetaQuery,
  useCreateR2FolderMutation,
  useUploadR2FilesMutation,
  useDeleteR2FileMutation,
  useDeleteR2FolderMutation,
} from '../../utils/api';
import {
  Folder,
  File as FileIcon,
  Trash2,
  Copy,
  ChevronRight,
  Search as SearchIcon,
  Upload,
  FolderPlus,
  Home,
  Eye,
  EyeOff,
  Database,
  HardDrive,
  ChevronDown,
  Grid3X3,
  List,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Enhanced Toasts ---
function Toasts({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(({ id, message, type }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className={`px-4 py-3 rounded-lg shadow-lg text-white flex items-center gap-2 min-w-[200px] ${
              type === 'error' 
                ? 'bg-red-600 border border-red-500' 
                : 'bg-green-600 border border-green-500'
            }`}
          >
            <div className="flex-1">{message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Enhanced Confirmation Modal ---
function ConfirmModal({ open, onClose, onConfirm, message, type = 'delete' }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl text-white space-y-4 max-w-md w-full">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Confirm {type === 'delete' ? 'Deletion' : 'Action'}</h3>
                  <p className="text-gray-400 text-sm">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-gray-300">{message}</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// --- Enhanced FileRow Component ---
function FileRow({ file, onDelete, showToast }) {
  const [showMeta, setShowMeta] = useState(false);
  
  // Always call the hook, but skip the query based on showMeta
  const { data: meta } = useGetR2ObjectMetaQuery(file.key, {
    skip: !showMeta,
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    return <FileIcon size={20} className="text-blue-400" />;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors"
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(file.key)}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate text-white">
                {file.key.split('/').pop()}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {file.key}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(file.url);
                showToast('URL copied to clipboard!', 'success');
              }}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
              title="Copy URL"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => setShowMeta((v) => !v)}
              className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors"
              title={showMeta ? 'Hide details' : 'Show details'}
            >
              {showMeta ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
            <button
              onClick={() => onDelete(file.key)}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              title="Delete file"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        
        <AnimatePresence>
          {showMeta && meta && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pt-3 border-t border-gray-700"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <div className="text-gray-400 text-xs mb-1">Size</div>
                  <div className="text-white font-mono">{formatFileSize(meta.size)}</div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <div className="text-gray-400 text-xs mb-1">Modified</div>
                  <div className="text-white text-xs">
                    {new Date(meta.lastModified).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-2">
                  <div className="text-gray-400 text-xs mb-1">Type</div>
                  <div className="text-white text-xs font-mono">{meta.contentType}</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function AdminR2FileManager() {
  // ALL STATE HOOKS FIRST - ALWAYS IN THE SAME ORDER
  const [prefix, setPrefix] = useState('');
  const [continuationToken, setContinuationToken] = useState();
  const [newFolder, setNewFolder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [confirmKey, setConfirmKey] = useState(null);
  const [confirmFolder, setConfirmFolder] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [allFiles, setAllFiles] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [hasMoreData, setHasMoreData] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // ALL API HOOKS - ALWAYS IN THE SAME ORDER
  const { data: listing = {}, isLoading, isFetching } = useListR2ObjectsQuery({
    prefix,
    continuationToken,
    maxKeys: 50,
    search: searchTerm,
  });

  const [createFolder, { isLoading: creatingFolder }] = useCreateR2FolderMutation();
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [deleteFile] = useDeleteR2FileMutation();
  const [deleteFolder] = useDeleteR2FolderMutation();

  // COMPUTED VALUES
  const {
    folders = [],
    files = [],
    isTruncated = false,
    nextToken = null,
  } = listing;

  // MEMOIZED VALUES
  const totalItems = useMemo(() => allFiles.length + allFolders.length, [allFiles.length, allFolders.length]);
  const totalPages = useMemo(() => Math.ceil(totalItems / itemsPerPage), [totalItems, itemsPerPage]);
  const startIndex = useMemo(() => (currentPage - 1) * itemsPerPage, [currentPage, itemsPerPage]);
  const endIndex = useMemo(() => startIndex + itemsPerPage, [startIndex, itemsPerPage]);

  const allItems = useMemo(() => [
    ...allFolders.map(f => ({ ...f, type: 'folder' })), 
    ...allFiles.map(f => ({ ...f, type: 'file' }))
  ], [allFolders, allFiles]);

  const currentItems = useMemo(() => allItems.slice(startIndex, endIndex), [allItems, startIndex, endIndex]);
  const currentFolders = useMemo(() => currentItems.filter(item => item.type === 'folder'), [currentItems]);
  const currentFiles = useMemo(() => currentItems.filter(item => item.type === 'file'), [currentItems]);

  const crumbs = useMemo(() => 
    prefix
      .split('/')
      .filter(Boolean)
      .map((p, i, arr) => ({
        label: p,
        path: arr.slice(0, i + 1).join('/') + '/',
      })),
    [prefix]
  );

  // ALL EFFECTS - ALWAYS IN THE SAME ORDER
  // Effect 1: Accumulate files and folders when new data comes in
  useEffect(() => {
    if (!continuationToken) {
      setAllFiles(files);
      setAllFolders(folders);
      setCurrentPage(1);
    } else {
      setAllFiles(prev => [...prev, ...files]);
      setAllFolders(prev => [...prev, ...folders]);
    }
    setHasMoreData(isTruncated);
    setLoadingMore(false);
  }, [files, folders, isTruncated, continuationToken]);

  // Effect 2: Reset when prefix or search changes
  useEffect(() => {
    setAllFiles([]);
    setAllFolders([]);
    setContinuationToken(undefined);
    setCurrentPage(1);
  }, [prefix, searchTerm]);

  // Effect 3: Auto-load more when reaching the end
  useEffect(() => {
    if (currentPage === totalPages && hasMoreData && totalItems < 200) {
      if (!loadingMore) {
        setLoadingMore(true);
        setContinuationToken(nextToken);
      }
    }
  }, [currentPage, totalPages, hasMoreData, totalItems, loadingMore, nextToken]);

  // HANDLER FUNCTIONS
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const enterFolder = (fp) => {
    setPrefix(fp);
    setContinuationToken(undefined);
  };

  const handleCreateFolder = async () => {
    if (!newFolder) return;
    try {
      await createFolder(newFolder).unwrap();
      showToast(`Folder "${newFolder}" created successfully!`);
      setNewFolder('');
    } catch (e) {
      showToast(`Create folder failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    try {
      await uploadFiles({ prefix, files: selectedFiles }).unwrap();
      showToast(`Successfully uploaded ${selectedFiles.length} file(s)!`);
      setSelectedFiles([]);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (e) {
      showToast(`Upload failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const confirmDeleteFile = (key) => setConfirmKey(key);
  
  const onDeleteFile = async (key) => {
    try {
      await deleteFile(key).unwrap();
      showToast('File deleted successfully!');
    } catch (e) {
      showToast(`Delete failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const confirmDeleteCurrentFolder = () => setConfirmFolder(true);
  
  const onDeleteFolder = async () => {
    try {
      await deleteFolder(prefix).unwrap();
      showToast('Folder deleted successfully!');
      const parts = prefix.split('/').filter(Boolean);
      parts.pop();
      setPrefix(parts.length ? parts.join('/') + '/' : '');
    } catch (e) {
      showToast(`Folder delete failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const handleLoadMore = async () => {
    if (hasMoreData && !loadingMore) {
      setLoadingMore(true);
      setContinuationToken(nextToken);
    }
  };

  // EARLY RETURN - AFTER ALL HOOKS
  if (isLoading && allFiles.length === 0 && allFolders.length === 0) {
    return (
      <div className="p-4 sm:p-6 text-white">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400 flex items-center gap-2">
            <Database className="animate-pulse" size={20} />
            Loading file system...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 text-white space-y-6 relative">
      <Toasts toasts={toasts} />

      {/* Header with enhanced stats */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="text-blue-400" size={24} />
            <h2 className="text-xl sm:text-2xl font-semibold">R2 File Manager</h2>
          </div>
          <p className="text-gray-400 text-sm">
            Manage your cloud storage files and folders
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Database size={16} />
            <span>{totalItems} items total</span>
            {hasMoreData && (
              <span className="text-blue-400">(+more available)</span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'} transition-colors`}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Items per page and pagination controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800 p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
          </span>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition-colors"
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-2 py-1 rounded text-sm ${
                      currentPage === pageNum 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    } transition-colors`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 rounded text-sm transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Search */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search files and folders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setContinuationToken(undefined)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors flex items-center gap-2"
          >
            <SearchIcon size={16} />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      </div>

      {/* Enhanced Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Create Folder */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <FolderPlus size={18} className="text-green-400" />
            <h3 className="font-medium">Create Folder</h3>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter folder name"
              value={newFolder}
              onChange={(e) => setNewFolder(e.target.value)}
              className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-green-500 focus:outline-none transition-colors"
            />
            <button
              onClick={handleCreateFolder}
              disabled={creatingFolder || !newFolder}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 rounded-lg transition-colors"
            >
              {creatingFolder ? '...' : 'Create'}
            </button>
          </div>
        </div>

        {/* Upload Files */}
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <Upload size={18} className="text-blue-400" />
            <h3 className="font-medium">Upload Files</h3>
          </div>
          <div className="space-y-2">
            <input
              type="file"
              multiple
              onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
              className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-700 file:text-white hover:file:bg-gray-600 file:cursor-pointer"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFiles.length}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 rounded-lg transition-colors"
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length || ''} Files`}
            </button>
          </div>
        </div>

        {/* Delete Current Folder */}
        {prefix && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center gap-2 mb-3">
              <Trash2 size={18} className="text-red-400" />
              <h3 className="font-medium">Danger Zone</h3>
            </div>
            <button
              onClick={confirmDeleteCurrentFolder}
              className="w-full px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
            >
              Delete Current Folder
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Breadcrumb */}
      <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
        <nav className="flex items-center gap-2 text-sm">
          <Home size={16} className="text-gray-400" />
          <button 
            onClick={() => enterFolder('')} 
            className="text-blue-400 hover:text-blue-300 underline transition-colors"
          >
            Root
          </button>
          {crumbs.map((c, i) => (
            <React.Fragment key={i}>
              <ChevronRight size={16} className="text-gray-500" />
              <button
                onClick={() => enterFolder(c.path)}
                className="text-blue-400 hover:text-blue-300 underline transition-colors"
              >
                {c.label}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Enhanced Folders Section */}
      {currentFolders.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <Folder size={20} className="text-yellow-400" />
            Folders ({allFolders.length})
          </h3>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
            : "space-y-2"
          }>
            {currentFolders.map((f) => (
              <motion.div
                key={f.Prefix}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-gray-800 border border-gray-700 rounded-lg p-3 hover:bg-gray-750 cursor-pointer transition-colors group ${
                  viewMode === 'list' ? 'flex items-center' : ''
                }`}
                onClick={() => enterFolder(f.Prefix)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <Folder size={20} className="text-yellow-400" />
                  <span className="flex-1 truncate font-medium">{f.Prefix.replace(prefix, '').replace('/', '')}</span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-white transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Enhanced Files Section */}
      {currentFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
            <FileIcon size={20} className="text-blue-400" />
            Files ({allFiles.length})
          </h3>
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 gap-3"
            : "space-y-3"
          }>
            {currentFiles.map((file) => (
              <FileRow
                key={file.key}
                file={file}
                onDelete={confirmDeleteFile}
                showToast={showToast}
              />
            ))}
          </div>
        </div>
      )}

      {/* Loading more indicator */}
      {(loadingMore || isFetching) && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Database className="animate-pulse" size={16} />
            <span>Loading more items...</span>
          </div>
        </div>
      )}

      {/* Load more section */}
      {hasMoreData && currentPage === totalPages && (
        <div className="text-center bg-gray-800 border border-gray-700 rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-3">
            There are more items available in this directory
          </p>
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            {loadingMore ? (
              <>
                <Database className="animate-pulse" size={16} />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                Load More Items
              </>
            )}
          </button>
        </div>
      )}

      {/* Enhanced Empty State */}
      {totalItems === 0 && !isLoading && !isFetching && (
        <div className="text-center py-12">
          <Database size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-400 mb-2">No files or folders</h3>
          <p className="text-gray-500 text-sm">
            {searchTerm ? 'No items match your search criteria.' : 'This directory is empty. Create a folder or upload files to get started.'}
          </p>
        </div>
      )}

      {/* Enhanced Modals */}
      <ConfirmModal
        open={!!confirmKey}
        message={`Are you sure you want to delete "${confirmKey?.split('/').pop()}"?`}
        onClose={() => setConfirmKey(null)}
        onConfirm={() => onDeleteFile(confirmKey)}
      />
      <ConfirmModal
        open={confirmFolder}
        message={`Are you sure you want to delete the folder "${prefix}" and all its contents? This action cannot be undone.`}
        onClose={() => setConfirmFolder(false)}
        onConfirm={onDeleteFolder}
      />
    </div>
  );
}
