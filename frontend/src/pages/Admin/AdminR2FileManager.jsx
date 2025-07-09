// src/pages/Admin/AdminR2FileManager.jsx
import React, { useState } from 'react';
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
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Simple Toasts ---
function Toasts({ toasts }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(({ id, message, type }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`px-4 py-2 rounded shadow text-white ${
              type === 'error' ? 'bg-red-600' : 'bg-green-600'
            }`}
          >
            {message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// --- Confirmation Modal ---
function ConfirmModal({ open, onClose, onConfirm, message }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
          >
            <div className="bg-gray-900 p-6 rounded-lg text-white space-y-4 max-w-xs w-full">
              <p>{message}</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className="px-4 py-2 bg-red-600 rounded"
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

// --- FileRow Component ---
function FileRow({ file, onDelete, showToast }) {
  const [showMeta, setShowMeta] = useState(false);
  const { data: meta } = useGetR2ObjectMetaQuery(file.key, {
    skip: !showMeta,
  });

  return (
    <div className="bg-gray-800 p-2 rounded space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileIcon size={20} />
          <span className="truncate">{file.key.split('/').pop()}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(file.url);
              showToast('Link copied', 'success');
            }}
            className="hover:text-blue-400"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={() => setShowMeta((v) => !v)}
            className="hover:text-yellow-400"
          >
            {showMeta ? 'Hide' : 'Info'}
          </button>
          <button
            onClick={() => onDelete(file.key)}
            className="hover:text-red-400"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      {showMeta && meta && (
        <div className="text-sm text-gray-300 space-y-1 pl-6">
          <div>Size: {meta.size} bytes</div>
          <div>
            Last Modified:{' '}
            {new Date(meta.lastModified).toLocaleString()}
          </div>
          <div>Type: {meta.contentType}</div>
        </div>
      )}
    </div>
  );
}

export default function AdminR2FileManager() {
  // State
  const [prefix, setPrefix] = useState('');
  const [continuationToken, setContinuationToken] = useState();
  const [newFolder, setNewFolder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [confirmKey, setConfirmKey] = useState(null);
  const [confirmFolder, setConfirmFolder] = useState(false);

  // Toast helper
  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  // Data
  const { data: listing = {}, isLoading } = useListR2ObjectsQuery({
    prefix,
    continuationToken,
    maxKeys: 50,
    search: searchTerm,
  });
  const {
    folders = [],
    files = [],
    isTruncated = false,
    nextToken = null,
  } = listing;

  // Mutations
  const [createFolder, { isLoading: creatingFolder }] =
    useCreateR2FolderMutation();
  const [uploadFiles, { isLoading: uploading }] =
    useUploadR2FilesMutation();
  const [deleteFile] = useDeleteR2FileMutation();
  const [deleteFolder] = useDeleteR2FolderMutation();

  if (isLoading) {
    return <div className="p-6 text-white">Loading…</div>;
  }

  // Breadcrumbs
  const crumbs = prefix
    .split('/')
    .filter(Boolean)
    .map((p, i, arr) => ({
      label: p,
      path: arr.slice(0, i + 1).join('/') + '/',
    }));

  // Handlers
  const enterFolder = (fp) => {
    setPrefix(fp);
    setContinuationToken(undefined);
  };

  const handleCreateFolder = async () => {
    if (!newFolder) return;
    try {
      await createFolder(newFolder).unwrap();
      showToast(`Folder “${newFolder}” created`);
      setNewFolder('');
    } catch (e) {
      showToast(`Create folder failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) return;
    try {
      await uploadFiles({ prefix, files: selectedFiles }).unwrap();
      showToast(`Uploaded ${selectedFiles.length} file(s)`);
      setSelectedFiles([]);
    } catch (e) {
      showToast(`Upload failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const confirmDeleteFile = (key) => setConfirmKey(key);
  const onDeleteFile = async (key) => {
    try {
      await deleteFile(key).unwrap();
      showToast('File deleted');
    } catch (e) {
      showToast(`Delete failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const confirmDeleteCurrentFolder = () => setConfirmFolder(true);
  const onDeleteFolder = async () => {
    try {
      await deleteFolder(prefix).unwrap();
      showToast('Folder deleted');
      // go up one level
      const parts = prefix.split('/').filter(Boolean);
      parts.pop();
      setPrefix(parts.length ? parts.join('/') + '/' : '');
    } catch (e) {
      showToast(`Folder delete failed: ${e.data?.error || e.message}`, 'error');
    }
  };

  const handleLoadMore = () => {
    if (isTruncated) setContinuationToken(nextToken);
  };

  return (
    <div className="p-6 text-white space-y-6 relative">
      <Toasts toasts={toasts} />

      {/* Search */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-2 bg-gray-700 rounded text-white"
        />
        <button
          onClick={() => setContinuationToken(undefined)}
          className="px-4 py-2 bg-gray-600 rounded"
        >
          <SearchIcon size={16} />
        </button>
      </div>

      {/* Create Folder */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="New folder name"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
          className="flex-1 p-2 bg-gray-700 rounded text-white"
        />
        <button
          onClick={handleCreateFolder}
          disabled={creatingFolder}
          className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50"
        >
          {creatingFolder ? 'Creating…' : 'Create Folder'}
        </button>
      </div>

      {/* Upload Files */}
      <div className="flex gap-2 items-center">
        <input
          type="file"
          multiple
          onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
          className="text-white  bg-gray-300/50 p-5 border-2 border-white/60 rounded-2xl"
        />
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="px-4 py-2 bg-green-600 rounded disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : 'Upload Files'}
        </button>
      </div>

      {/* Delete Current Folder */}
      {prefix && (
        <button
          onClick={confirmDeleteCurrentFolder}
          className="px-4 py-2 bg-red-600 rounded"
        >
          Delete Folder & Contents
        </button>
      )}

      {/* Breadcrumb */}
      <nav className="text-blue-300">
        <button onClick={() => enterFolder('')} className="underline">
          /  
        </button>
        {crumbs.map((c, i) => (
          <span key={i}>
            <button
              onClick={() => enterFolder(c.path)}
              className="underline"
            >
              {c.label}
            </button>
            /
          </span>
        ))}
      </nav>

      {/* Folders */}
      <div className="space-y-2">
        {folders.map((f) => (
          <div
            key={f.Prefix}
            className="flex items-center gap-2 hover:bg-gray-700 p-2 rounded cursor-pointer"
            onClick={() => enterFolder(f.Prefix)}
          >
            <Folder size={20} />
            {f.Prefix.replace(prefix, '')}
            <ChevronRight size={16} className="ml-auto" />
          </div>
        ))}
      </div>

      {/* Files */}
      <div className="space-y-2">
        {files.map((file) => (
          <FileRow
            key={file.key}
            file={file}
            onDelete={confirmDeleteFile}
            showToast={showToast}
          />
        ))}
      </div>

      {/* Load More */}
      {isTruncated && (
        <button
          onClick={handleLoadMore}
          className="px-4 py-2 bg-gray-700 rounded"
        >
          Load More…
        </button>
      )}

      {/* Modals */}
      <ConfirmModal
        open={!!confirmKey}
        message="Delete this file?"
        onClose={() => setConfirmKey(null)}
        onConfirm={() => onDeleteFile(confirmKey)}
      />
      <ConfirmModal
        open={confirmFolder}
        message={`Delete folder “${prefix}” and all its contents?`}
        onClose={() => setConfirmFolder(false)}
        onConfirm={onDeleteFolder}
      />
    </div>
  );
}
