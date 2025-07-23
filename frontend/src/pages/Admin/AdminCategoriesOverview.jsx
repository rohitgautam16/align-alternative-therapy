// src/pages/Admin/AdminCategoriesOverview.jsx
import React, { useState, useEffect } from 'react';
import {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUploadR2FilesMutation
} from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus, Search, X, Upload } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminCategoriesOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const frontendPageSize = 12;

  // Search and Filter
  const [searchTerm, setSearchTerm] = useState('');

  // File uploads
  const [uploadFiles, { isLoading: uploading }] = useUploadR2FilesMutation();
  const [selectedArtFile, setSelectedArtFile] = useState(null);

  // Fetch categories - get more for client-side filtering
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useListCategoriesQuery({ page: 1, pageSize: 200 });

  // Create mutation
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();

  // Form state
  const [form, setForm] = useState({
    title: '',
    slug: '',
    tags: '',
    artwork_filename: '',
  });

  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Process data
  const allCategories = React.useMemo(() => {
    if (!data) return [];
    
    if (Array.isArray(data)) {
      return data;
    }
    
    if (data.data && Array.isArray(data.data)) {
      return data.data;
    }
    
    return [];
  }, [data]);

  // Filter categories
  const filteredCategories = React.useMemo(() => {
    return allCategories.filter(category => {
      const matchesSearch = !searchTerm || 
        category.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.tags?.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSearch;
    });
  }, [allCategories, searchTerm]);

  // Pagination for filtered results
  const totalItems = data?.total || filteredCategories.length;
  const totalPages = Math.ceil(filteredCategories.length / frontendPageSize);
  const startIndex = (page - 1) * frontendPageSize;
  const paginatedCategories = filteredCategories.slice(startIndex, startIndex + frontendPageSize);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  // Fixed auto-generate slug from title
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

  // Image upload handler
  const handleArtworkUpload = async () => {
    if (!selectedArtFile) return;
    setFlash({ txt: 'Uploading image…', ok: true });
    
    try {
      const res = await uploadFiles({
        prefix: 'align-images/categories',
        files: [selectedArtFile],
      }).unwrap();

      const uploadedArray = res.uploaded || res;
      const key = uploadedArray?.[0]?.key;
      if (!key) throw new Error('No key returned from upload');

      const publicUrl = `https://cdn.align-alternativetherapy.com/${key}`;
      setForm(f => ({ ...f, artwork_filename: publicUrl }));
      setFlash({ txt: 'Image uploaded!', ok: true });

      setSelectedArtFile(null);
      document.getElementById('create-artwork-upload').value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setFlash({ txt: 'Upload failed.', ok: false });
    }
  };

  const toggleView = () => {
    setViewType((prev) => (prev === 'grid' ? 'list' : 'grid'));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    
    try {
      await createCategory(form).unwrap();
      setFlash({ txt: 'Category created successfully!', ok: true });
      
      setForm({
        title: '',
        slug: '',
        tags: '',
        artwork_filename: '',
      });
      setSelectedArtFile(null);
      
      const artInput = document.getElementById('create-artwork-upload');
      if (artInput) artInput.value = '';
      
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Create category error:', err);
      setFlash({ txt: 'Failed to create category.', ok: false });
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
  };

  return (
    <div className="p-4 sm:p-6 text-white space-y-6">
      {/* Flash Messages */}
      <AnimatePresence>
        {flash.txt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3 text-center rounded ${flash.ok ? 'bg-green-600' : 'bg-red-600'}`}
          >
            {flash.txt}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Categories Overview</h2>
          <p className="text-gray-400 text-sm">
            {totalItems} categor{totalItems !== 1 ? 'ies' : 'y'} total, {filteredCategories.length} shown
            {searchTerm && ` (filtered)`}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 px-3 sm:px-4 py-2 rounded hover:bg-blue-500 flex-1 sm:flex-none text-sm sm:text-base"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{showCreateForm ? 'Cancel' : 'Create Category'}</span>
            <span className="sm:hidden">{showCreateForm ? 'Cancel' : 'Create'}</span>
          </button>
          <button
            onClick={toggleView}
            className="flex items-center justify-center gap-2 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 text-sm sm:text-base"
          >
            {viewType === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            <span className="hidden sm:inline">{viewType === 'grid' ? 'List' : 'Grid'}</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search categories by title, slug, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          {searchTerm && (
            <button
              onClick={clearFilters}
              className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2 sm:px-0 sm:py-0"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreate}
            className="bg-gray-800 p-4 sm:p-6 rounded-lg space-y-4 overflow-hidden"
          >
            <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
              <Plus size={20} /> Create New Category
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Title *</label>
                <input
                  placeholder="Category title"
                  value={form.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    setForm(prevForm => ({ 
                      ...prevForm, 
                      title,
                      slug: prevForm.slug === '' || prevForm.slug === generateSlug(prevForm.title) 
                        ? generateSlug(title) 
                        : prevForm.slug,
                    }));
                  }}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Slug *</label>
                <input
                  placeholder="category-slug"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-gray-400 text-sm mb-1">Tags</label>
                <input
                  placeholder="comma, separated, tags"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Artwork Upload */}
            <div>
              <label className="block text-gray-400 text-sm mb-1">Artwork</label>
              <input
                type="text"
                placeholder="Or paste artwork URL"
                value={form.artwork_filename}
                onChange={(e) => setForm({ ...form, artwork_filename: e.target.value })}
                className="w-full p-2 bg-gray-700 rounded text-white mb-2 text-sm sm:text-base"
              />
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  id="create-artwork-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => setSelectedArtFile(e.target.files?.[0] || null)}
                />
                <label
                  htmlFor="create-artwork-upload"
                  className="flex items-center justify-center gap-1 px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded cursor-pointer text-sm flex-1 sm:flex-none"
                >
                  <Upload size={14} />
                  <span className="truncate">
                    {selectedArtFile ? selectedArtFile.name : 'Choose Image'}
                  </span>
                </label>
                
                <button
                  type="button"
                  onClick={handleArtworkUpload}
                  disabled={uploading || !selectedArtFile}
                  className="px-3 py-2 bg-blue-600 rounded text-sm disabled:opacity-50 hover:bg-blue-500 whitespace-nowrap"
                >
                  {uploading ? 'Uploading…' : 'Upload'}
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 order-2 sm:order-1"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-500 order-1 sm:order-2"
              >
                {creating ? 'Creating…' : 'Create Category'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading categories...</div>
        </div>
      )}

      {isError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">
            Error: {error?.data?.error || 'Failed to load categories'}
          </p>
        </div>
      )}

      {/* Categories Grid/List with Playlist Card Layout */}
      {!isLoading && !isError && (
        <>
          {paginatedCategories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {filteredCategories.length === 0 ? 'No categories found matching your search' : 'No categories on this page'}
            </div>
          ) : (
            <div
              className={`grid gap-3 sm:gap-4 ${
                viewType === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                  : 'grid-cols-1'
              }`}
            >
              {paginatedCategories.map((category) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800 rounded-lg flex flex-col-reverse md:flex-row h-auto md:h-48 overflow-hidden hover:bg-gray-750 transition-colors"
                >
                  {/* Left pane (text + buttons) - Same as playlist card */}
                  <div className="flex-1 flex flex-col p-4 justify-between mt-4 md:mt-0 min-w-0">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-lg md:text-xl text-white truncate mb-1">
                        {category.title}
                      </h3>
                      <p className="text-sm md:text-md text-gray-400 truncate mb-1">
                        Slug: {category.slug}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        Category Id: {category.id}
                      </p>
                    </div>
                    
                    <div className="mt-3 md:mt-4 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/admin/categories/${category.id}`)}
                        className="text-blue-400 hover:underline flex items-center gap-1 text-sm whitespace-nowrap"
                      >
                        <Eye size={14} /> Edit
                      </button>
                    </div>
                  </div>

                  {/* Right pane (image) - Same as playlist card */}
                  <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-full">
                    <img
                      src={category.image || category.artwork_filename || ''}
                      alt={category.title}
                      className="w-full h-full rounded-t-lg md:rounded-t-none md:rounded-r-lg object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik05NiA2NEwxMjggMTI4SDY0TDk2IDY0WiIgZmlsbD0iIzZCNzI4MCIvPgo8L3N2Zz4=';
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-4 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 sm:px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Previous</span>
                <span className="sm:hidden">Prev</span>
              </button>
              
              <div className="flex items-center gap-1 sm:gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-2 sm:px-3 py-1 rounded text-sm ${
                        page === pageNum 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 sm:px-4 py-2 bg-gray-700 rounded disabled:opacity-50 hover:bg-gray-600 text-sm sm:text-base"
              >
                <span className="hidden sm:inline">Next</span>
                <span className="sm:hidden">Next</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
