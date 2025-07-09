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

  // Data & mutations
  const { data: user, isLoading, isError } = useGetAdminUserQuery(id);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();

  // Local state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize form
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

  // Clear banners
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  const handleSave = async () => {
    try {
      await updateUser({ id, ...form }).unwrap();
      setSuccessMsg('User updated successfully.');
      setEditMode(false);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to update user.');
    }
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete  = () => setShowDeleteModal(false);

  const handleDelete = async () => {
    try {
      await deleteUser(id).unwrap();
      setSuccessMsg('User deleted.');
      setShowDeleteModal(false);
      setTimeout(() => navigate('/admin/users'), 500);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete user.');
      setShowDeleteModal(false);
    }
  };

  if (isLoading) return <div className="p-6 text-white">Loading...</div>;
  if (isError || !user) return <div className="p-6 text-red-500">Failed to load user.</div>;
  if (!form) return null;

  return (
    <div className="p-6 space-y-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft size={20} /> Back to Users
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setEditMode((e) => !e)}
            className="flex items-center gap-1 bg-gray-700 px-3 py-1 rounded hover:bg-gray-600"
          >
            <Edit3 size={16} /> {editMode ? 'Cancel' : 'Edit'}
          </button>
          {editMode && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 bg-blue-600 px-3 py-1 rounded hover:bg-blue-500 disabled:opacity-50"
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          <button
            onClick={confirmDelete}
            className="flex items-center gap-1 bg-red-600 px-3 py-1 rounded hover:bg-red-500"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Banners */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-green-600 rounded"
        >
          {successMsg}
        </motion.div>
      )}
      {errorMsg && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-red-600 rounded"
        >
          {errorMsg}
        </motion.div>
      )}

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left pane */}
        <div className="bg-gray-800 p-6 rounded-lg flex flex-col items-center">
          <div className="w-24 h-24 bg-gray-700 rounded-full mb-4 flex items-center justify-center text-3xl text-gray-400">
            {user.full_name.charAt(0)}
          </div>
          <h3 className="text-xl font-semibold mb-2">{user.full_name}</h3>
          <p className="text-gray-300 mb-1">{user.email}</p>
          <p className="text-gray-400 text-sm">Joined: {new Date(user.created_at).toLocaleDateString()}</p>
          <p className="text-gray-400 text-sm">Subscribed: {user.is_subscribed ? 'Yes' : 'No'}</p>
        </div>

        {/* Right pane */}
        <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-gray-400 mb-1">Full Name</label>
              {editMode ? (
                <input
                  value={form.full_name}
                  onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <p>{user.full_name}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="block text-gray-400 mb-1">Email</label>
              <p className="text-gray-300">{user.email}</p>
            </div>
            {/* Role */}
            <div>
              <label className="block text-gray-400 mb-1">Role</label>
              {editMode ? (
                <select
                  value={form.user_roles}
                  onChange={(e) => setForm((f) => ({ ...f, user_roles: +e.target.value }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                >
                  <option value={0}>User</option>
                  <option value={1}>Admin</option>
                </select>
              ) : (
                <p className="text-gray-300">{user.user_roles === 1 ? 'Admin' : 'User'}</p>
              )}
            </div>
            {/* Active */}
            <div>
              <label className="block text-gray-400 mb-1">Active</label>
              {editMode ? (
                <select
                  value={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: +e.target.value }))}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                >
                  <option value={1}>Yes</option>
                  <option value={0}>No</option>
                </select>
              ) : (
                <p className="text-gray-300">{user.active ? 'Yes' : 'No'}</p>
              )}
            </div>
            {/* Status */}
            <div className="md:col-span-2">
              <label className="block text-gray-400 mb-1">Status Message</label>
              {editMode ? (
                <textarea
                  value={form.status_message}
                  onChange={(e) => setForm((f) => ({ ...f, status_message: e.target.value }))}
                  rows={3}
                  className="w-full p-2 bg-gray-700 rounded text-white"
                />
              ) : (
                <p className="text-gray-300">{user.status_message || '—'}</p>
              )}
            </div>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-gray-400 text-sm">
            <div>Created: {new Date(user.created_at).toLocaleString()}</div>
            <div>Updated: {new Date(user.updated_at).toLocaleString()}</div>
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
              <div className="bg-gray-900 rounded-lg p-6 space-y-4 max-w-sm w-full">
                <h3 className="text-lg font-semibold text-white">Confirm Deletion</h3>
                <p className="text-gray-300">Are you sure you want to delete user <strong>{user.full_name}</strong>?</p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={cancelDelete}
                    className="px-4 py-2 bg-gray-700 rounded text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 rounded text-white"
                  >
                    Delete
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
