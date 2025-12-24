// src/pages/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthActions } from '../hooks/useAuthActions';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useDeleteProfileMutation,
  useGetSubscriptionsQuery,
} from '../utils/api';

export default function ProfilePage() {
  const { logout } = useAuthActions();
  const navigate = useNavigate(); 

  // RTK Query hooks
  const {
    data: profile,
    isLoading: profileLoading,
    isError: profileError,
    error: profileErrObj,
    refetch: refetchProfile,
  } = useGetProfileQuery();

  const { data: subs = [], isLoading: subsLoading } = useGetSubscriptionsQuery();

  const [updateProfile, { isLoading: savingAny }] = useUpdateProfileMutation();
  const [deleteUser,   { isLoading: deleting }]   = useDeleteProfileMutation();

  // Local UI state
  const [editingName, setEditingName]       = useState(false);
  const [editingStatus, setEditingStatus]   = useState(false);
  const [newName, setNewName]               = useState('');
  const [newStatus, setNewStatus]           = useState('');
  const [error, setError]                   = useState(null);

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      setNewName(profile.full_name || '');
      setNewStatus(profile.status_message || '');
    }
  }, [profile]);

  // Save full_name
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setError(null);
    try {
      await updateProfile({ full_name: newName.trim() }).unwrap();
      await refetchProfile();
      setEditingName(false);
    } catch (e) {
      setError(e?.data?.error || e?.error || 'Failed to update name');
    }
  };

  // Save status_message
  const handleSaveStatus = async () => {
    if (!newStatus.trim()) return;
    setError(null);
    try {
      await updateProfile({ status_message: newStatus.trim() }).unwrap();
      await refetchProfile();
      setEditingStatus(false);
    } catch (e) {
      setError(e?.data?.error || e?.error || 'Failed to update status');
    }
  };

  // Delete account
  const handleDelete = async () => {
    if (!window.confirm('Really delete your account?')) return;
    setError(null);
    try {
      await deleteUser().unwrap();
      await logout({ redirectTo: '/login' });
    } catch (e) {
      setError(e?.data?.error || e?.error || 'Failed to delete account');
    }
  };

  // Loading / error states
  if (profileLoading) return <p>Loading profile…</p>;
  if (profileError) {
    const msg =
      profileErrObj?.data?.error ||
      profileErrObj?.error ||
      'Failed to load profile';
    return <p className="text-red-400">Error: {msg}</p>;
  }

  const latestSub = subs[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-black/60 backdrop-blur-md text-white"
    >
      {/* Header Image & Name */}
      <div className="relative h-64">
        <img
          src="https://images.unsplash.com/photo-1684166251886-5c4fbb1d3c5b?q=80&w=2070&auto=format&fit=crop"
          alt="Header"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50 flex items-end px-6 pb-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            {profile.full_name}
          </h1>
        </div>
      </div>

      <div className="mx-auto p-6 space-y-8">
        {/* Full Name */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Full Name</h2>
            <Pencil
              onClick={() => setEditingName((v) => !v)}
              className="cursor-pointer hover:text-red-400 transition"
            />
          </div>

          {editingName ? (
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 p-2 rounded bg-white/10 focus:outline-none"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <button
                onClick={handleSaveName}
                disabled={savingAny}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingAny ? 'Saving…' : 'Save Name'}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-gray-300">{profile.full_name}</p>
          )}
        </section>

        {/* Describe Yourself */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Describe Yourself</h2>
            <Pencil
              onClick={() => setEditingStatus((v) => !v)}
              className="cursor-pointer hover:text-red-400 transition"
            />
          </div>

          {editingStatus ? (
            <div className="mt-2 space-y-2">
              <textarea
                rows={3}
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-3 rounded bg-white/10 focus:outline-none"
              />
              <button
                onClick={handleSaveStatus}
                disabled={savingAny}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingAny ? 'Saving…' : 'Save Status'}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-gray-300">
              {profile.status_message || 'No status set.'}
            </p>
          )}
        </section>

        {/* Email, Joined & (optional) Subscription */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="font-medium">Email</h3>
            <p className="text-gray-300">{profile.email}</p>
          </div>
          <div>
            <h3 className="font-medium">Joined</h3>
            <p className="text-gray-300">
              {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
          {/* <div>
            <h3 className="font-medium">Subscription</h3>
            {subsLoading ? (
              <p>Loading…</p>
            ) : !latestSub ? (
              <p className="text-gray-400">No active subscription</p>
            ) : latestSub.status === 'trialing' ? (
              <p className="text-green-300">
                On trial until {new Date(latestSub.expires_at).toLocaleDateString()}
              </p>
            ) : (
              <p className="text-green-300">
                Subscribed ({latestSub.subscription_type}), next renewal:{' '}
                {new Date(latestSub.expires_at).toLocaleDateString()}
              </p>
            )}
          </div> */}
         
        </section>

        {/* Actions / Errors */}
        {error && <p className="text-red-400">{error}</p>}
        
        {/* <div className="border-t border-white/20 pt-4">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
          >
            {deleting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div> */}
       
      </div>
    </motion.div>
  );
}
