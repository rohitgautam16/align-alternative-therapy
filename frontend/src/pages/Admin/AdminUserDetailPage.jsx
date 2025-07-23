// src/pages/Admin/AdminUserDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation
} from '../../utils/api';
import { ArrowLeft, Save, Trash2, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data & mutations (kept exactly the same)
  const { data: user, isLoading, isError } = useGetAdminUserQuery(id);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Local state (kept exactly the same)
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Initialize form (kept exactly the same)
  useEffect(() => {
    if (user) {
      setForm({
        full_name:      user.full_name,
        status_message: user.status_message || '',
        user_roles:     user.user_roles,
        active:         user.active,
      });
    }
  }, [user]);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Handlers (kept exactly the same logic)
  const handleSave = async () => {
    try {
      await updateUser({ id, ...form }).unwrap();
      setFlash({ txt: 'User updated successfully!', ok: true });
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setFlash({ txt: 'Failed to update user.', ok: false });
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete  = () => setShowDeleteModal(false);

  const handleDelete = async () => {
    try {
      await deleteUser(id).unwrap();
      setFlash({ txt: 'User deleted successfully!', ok: true });
      setShowDeleteModal(false);
      setTimeout(() => navigate('/admin/users'), 500);
    } catch (err) {
      console.error(err);
      setFlash({ txt: 'Failed to delete user.', ok: false });
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return (
    <div className="p-4 sm:p-6 text-white">
      <div className="flex justify-center items-center py-12">
        <div className="text-gray-400">Loading user details...</div>
      </div>
    </div>
  );
  
  if (isError || !user) return (
    <div className="p-4 sm:p-6 text-white">
      <div className="bg-red-900/20 border border-red-600 p-4 rounded">
        <p className="text-red-400">Failed to load user details.</p>
      </div>
    </div>
  );
  
  if (!form) return null;

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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} /> 
          <span className="hidden sm:inline">Back to Users</span>
          <span className="sm:hidden">Back</span>
        </button>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 transition-colors flex-1 sm:flex-none"
          >
            <Edit3 size={16} /> 
            <span>{editMode ? 'Cancel' : 'Edit'}</span>
          </button>
          
          {editMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-2 rounded hover:bg-blue-500 disabled:opacity-50 transition-colors flex-1 sm:flex-none"
            >
              <Save size={16} /> 
              <span>{isSaving ? 'Saving…' : 'Save'}</span>
            </button>
          )}
          
          <button
            onClick={confirmDelete}
            className="flex items-center gap-1 bg-red-600 px-3 py-2 rounded hover:bg-red-500 transition-colors"
          >
            <Trash2 size={16} /> 
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - User Profile Card */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl sm:text-3xl font-semibold text-gray-300">
              {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">{user.full_name || 'Unnamed User'}</h3>
            <p className="text-gray-300 text-sm sm:text-base break-all">{user.email}</p>
          </div>

          {/* Profile Details */}
          <div className="p-4 sm:p-6 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">User ID:</span>
              <span className="text-white text-sm font-mono">#{user.id}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Role:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${
                user.user_roles === 1 
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'bg-blue-600/20 text-blue-400'
              }`}>
                {user.user_roles === 1 ? 'Admin' : 'User'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${
                user.active 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-red-600/20 text-red-400'
              }`}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Subscribed:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${
                user.is_subscribed 
                  ? 'bg-emerald-600/20 text-emerald-400' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {user.is_subscribed ? 'Yes' : 'No'}
              </span>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="text-gray-400 text-xs mb-1">Member since:</div>
              <div className="text-white text-sm">
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Edit Form */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 sm:p-6">
          <h4 className="text-lg font-semibold mb-6 text-white">User Information</h4>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Full Name</label>
                {editMode ? (
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {user.full_name || '—'}
                  </div>
                )}
              </div>

              {/* Email (Read-only) */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Email</label>
                <div className="p-3 bg-gray-700/30 rounded-lg text-gray-400 border border-gray-600">
                  {user.email}
                  <span className="ml-2 text-xs text-gray-500">(Read-only)</span>
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Role</label>
                {editMode ? (
                  <select
                    value={form.user_roles}
                    onChange={(e) => setForm((f) => ({ ...f, user_roles: +e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={0}>User</option>
                    <option value={1}>Admin</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {user.user_roles === 1 ? 'Admin' : 'User'}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Active Status</label>
                {editMode ? (
                  <select
                    value={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: +e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {user.active ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>
            </div>

            {/* Status Message */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm font-medium">Status Message</label>
              {editMode ? (
                <textarea
                  value={form.status_message}
                  onChange={(e) => setForm((f) => ({ ...f, status_message: e.target.value }))}
                  rows={3}
                  className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  placeholder="Enter status message (optional)"
                />
              ) : (
                <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300 min-h-[80px]">
                  {user.status_message || '—'}
                </div>
              )}
            </div>

            {/* Timestamps */}
            <div className="border-t border-gray-700 pt-6">
              <h5 className="text-sm font-medium text-gray-400 mb-4">Account Timeline</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div className="text-sm text-gray-300">
                    {new Date(user.created_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
                <div className="bg-gray-700/30 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">Last Updated</div>
                  <div className="text-sm text-gray-300">
                    {new Date(user.updated_at).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            />
            {/* Modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
            >
              <div className="bg-gray-900 rounded-lg p-6 space-y-4 max-w-md w-full border border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center">
                    <Trash2 size={20} className="text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Delete User</h3>
                    <p className="text-gray-400 text-sm">This action cannot be undone</p>
                  </div>
                </div>
                
                <p className="text-gray-300">
                  Are you sure you want to permanently delete <strong className="text-white">{user.full_name || user.email}</strong>?
                </p>
                
                <div className="flex flex-col sm:flex-row justify-end gap-2">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-700 rounded-lg text-white hover:bg-gray-600 transition-colors order-2 sm:order-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors order-1 sm:order-2"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
