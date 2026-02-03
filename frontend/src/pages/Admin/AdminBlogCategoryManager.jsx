import React, { useState } from 'react';
import {
  useListBlogCategoriesAdminQuery,
  useCreateBlogCategoryAdminMutation,
  useUpdateBlogCategoryAdminMutation,
  useDeleteBlogCategoryAdminMutation,
} from '../../utils/api';

export default function AdminBlogCategoryManager() {
  const { data, isLoading, refetch } = useListBlogCategoriesAdminQuery();
  const [createCategory] = useCreateBlogCategoryAdminMutation();
  const [updateCategory] = useUpdateBlogCategoryAdminMutation();
  const [deleteCategory] = useDeleteBlogCategoryAdminMutation();

  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  const rows = data?.data || [];

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createCategory({ name }).unwrap();
    setNewName('');
    refetch();
  };

  const handleUpdate = async (id) => {
    const name = editName.trim();
    if (!name) return;
    await updateCategory({ id, body: { name } }).unwrap();
    setEditingId(null);
    setEditName('');
    refetch();
  };

  const handleDelete = async (row) => {
    if (row.usage_count > 0) return;

    if (!window.confirm(`Delete category "${row.name}"?`)) return;

    try {
      await deleteCategory(row.id).unwrap();
      refetch();
    } catch (err) {
      alert(`Cannot delete: used by ${row.usage_count} blog(s).`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className=" mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* HEADER */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Blog Categories</h1>
              <p className="text-white/60 text-lg">Manage your blog categories</p>
            </div>
            <div className="w-full sm:w-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex flex-1 sm:flex-none gap-2">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    placeholder="New category name"
                    className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-4 py-3 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none text-sm sm:text-base"
                  />
                  <button
                    onClick={handleCreate}
                    disabled={!newName.trim()}
                    className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 disabled:from-secondary/50 disabled:to-secondary/60 text-black px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-secondary/20 whitespace-nowrap"
                  >
                    Add Category
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">All Categories</h2>
              <div className="text-white/50 text-sm">
                {rows.length} {rows.length === 1 ? 'category' : 'categories'}
              </div>
            </div>
          </div>

          {/* Responsive Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10">
                  <th className="text-left px-6 py-4 font-semibold text-white/90 w-1/2">
                    Category Name
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-white/90 min-w-[120px]">
                    Slug
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-white/90 min-w-[100px]">
                    Usage
                  </th>
                  <th className="text-left px-6 py-4 font-semibold text-white/90 w-48">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((row) => {
                  const isEditing = editingId === row.id;
                  const blockDelete = row.usage_count > 0;

                  return (
                    <tr key={row.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleUpdate(row.id)}
                              className="bg-white/10 border border-white/20 focus:border-secondary focus:ring-2 focus:ring-secondary/20 px-4 py-2 rounded-xl w-full text-white placeholder-white/40 transition-all duration-200 outline-none"
                              placeholder="Category name"
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-secondary"></div>
                            <span className="text-white font-medium">{row.name}</span>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="bg-white/5 px-3 py-1 rounded-full text-xs font-mono text-white/70">
                          {row.slug}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {row.usage_count === 0 ? (
                          <span className="px-3 py-1 bg-white/5 text-white/50 rounded-full text-xs font-medium">
                            No blogs
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-secondary/20 text-secondary border border-secondary/30 rounded-full text-xs font-semibold">
                            {row.usage_count} blog{row.usage_count > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {!isEditing && (
                            <button
                              onClick={() => {
                                setEditingId(row.id);
                                setEditName(row.name);
                              }}
                              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border border-white/10 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Rename
                            </button>
                          )}
                          
                          {isEditing && (
                            <>
                              <button
                                onClick={() => handleUpdate(row.id)}
                                disabled={!editName.trim()}
                                className="bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 disabled:from-secondary/50 disabled:to-secondary/60 text-black px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 shadow-lg shadow-secondary/20 whitespace-nowrap flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 border border-white/10 flex items-center gap-1"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          
                          {!isEditing && (
                            <button
                              disabled={blockDelete}
                              title={blockDelete ? `Used by ${row.usage_count} blogs` : 'Delete category'}
                              onClick={() => handleDelete(row)}
                              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-1 ${
                                blockDelete
                                  ? 'bg-white/5 text-white/40 border border-white/10 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/20'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-white/50 space-y-2">
                        <div className="text-4xl mb-4">📂</div>
                        <h3 className="text-lg font-medium text-white">No categories yet</h3>
                        <p>Create your first category above to get started.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
