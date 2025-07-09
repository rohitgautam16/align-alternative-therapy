// src/pages/ProfilePage.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthHeader from 'react-auth-kit/hooks/useAuthHeader';
import useSignOut from 'react-auth-kit/hooks/useSignOut';
import { motion } from 'framer-motion';
import { Pencil } from 'lucide-react';
import { useGetSubscriptionsQuery } from '../utils/api';  // ← pull in your RTK‑Query hook

const API = import.meta.env.VITE_API_BASE_URL;

export default function ProfilePage() {
  const authHeader = useAuthHeader();
  const signOut    = useSignOut();
  const navigate   = useNavigate();

  // load subscription status
  const { data: subs = [], isLoading: subsLoading } = useGetSubscriptionsQuery();

  const [profile, setProfile]       = useState(null);
  const [status,  setStatus]        = useState('loading'); // 'loading' | 'error' | 'ready'
  const [error,   setError]         = useState(null);

  const [newName,       setNewName]       = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [savingName,    setSavingName]    = useState(false);

  const [newStatus,     setNewStatus]     = useState('');
  const [editingStatus, setEditingStatus] = useState(false);
  const [savingStatus,  setSavingStatus]  = useState(false);

  // shared profile loader
  const loadProfile = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch(`${API}user/profile`, {
        headers: { Authorization: authHeader },
        credentials: 'include'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfile(data);
      setNewName(data.full_name);
      setNewStatus(data.status_message || '');
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [authHeader]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // save full_name
  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const res = await fetch(`${API}user/update`, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ full_name: newName })
      });
      if (!res.ok) throw new Error(`Name update failed (${res.status})`);
      await loadProfile();
      setEditingName(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  // save status_message
  const handleSaveStatus = async () => {
    if (!newStatus.trim()) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`${API}user/update`, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status_message: newStatus })
      });
      if (!res.ok) throw new Error(`Status update failed (${res.status})`);
      await loadProfile();
      setEditingStatus(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingStatus(false);
    }
  };

  // delete account
  const handleDelete = async () => {
    if (!window.confirm('Really delete your account?')) return;
    try {
      const res = await fetch(`${API}user/delete`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
        credentials: 'include'
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Delete failed (${res.status})`);
      }
      signOut();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  if (status === 'loading') return <p>Loading profile…</p>;
  if (status === 'error')   return <p className="text-red-400">Error: {error}</p>;

  // pick latest subscription (if any)
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

      <section>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Full Name</h2>
            <Pencil
              onClick={() => setEditingName(v => !v)}
              className="cursor-pointer hover:text-red-400 transition"
            />
          </div>
          {editingName ? (
            <div className="mt-2 flex gap-2">
              <input
                className="flex-1 p-2 rounded bg-white/10 focus:outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingName ? 'Saving…' : 'Save Name'}
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
              onClick={() => setEditingStatus(v => !v)}
              className="cursor-pointer hover:text-red-400 transition"
            />
          </div>
          {editingStatus ? (
            <div className="mt-2 space-y-2">
              <textarea
                rows={3}
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                className="w-full p-3 rounded bg-white/10 focus:outline-none"
              />
              <button
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {savingStatus ? 'Saving…' : 'Save Status'}
              </button>
            </div>
          ) : (
            <p className="mt-2 text-gray-300">
              {profile.status_message || 'No status set.'}
            </p>
          )}
        </section>

        {/* Email, Joined & Subscription */}
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
                Subscribed ({latestSub.subscription_type}), next renewal: {' '}
                {new Date(latestSub.expires_at).toLocaleDateString()}
              </p>
            )}
          </div> */}
        </section>


        

        {/* Delete Account */}
        {/* <div className="border-t border-white/20 pt-4">
          {error && <p className="text-red-400 mb-2">{error}</p>}
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Delete Account
          </button>
        </div> */}
      </div>
    </motion.div>
  );
}
