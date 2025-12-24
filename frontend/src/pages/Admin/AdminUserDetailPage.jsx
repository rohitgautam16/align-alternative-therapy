// src/pages/Admin/AdminUserDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useGetAdminUserQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useRetryPaymentMutation
} from '../../utils/api';
import { 
  ArrowLeft, Save, Trash2, Edit3, X, CheckCircle, 
  Info, ExternalLink, Copy, Zap, Gift, CreditCard,
  Link as LinkIcon, RefreshCw, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data & mutations
  const { data: user, isLoading, isError, refetch } = useGetAdminUserQuery(id);
  const [updateUser, { isLoading: isSaving }] = useUpdateUserMutation();
  const [deleteUser] = useDeleteUserMutation();
  const [retryPayment, { isLoading: isRetrying }] = useRetryPaymentMutation();

  // Local state
  const [form, setForm] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [flash, setFlash] = useState({ txt: '', ok: true });
  const [currentCheckoutUrl, setCurrentCheckoutUrl] = useState(null);

  // Tier mapping
  const getTierFromProfileType = (profileType) => {
    const tierMap = {
      free: 1,
      recommendations_only: 2,
      premium_full: 3,
    };
    return tierMap[profileType] || 1;
  };

  // Initialize form with all new fields
  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        status_message: user.status_message || '',
        user_roles: user.user_roles,
        active: user.active,
        is_subscribed: user.is_subscribed ? 1 : 0,
        profile_type: user.profile_type || 'free',
        user_tier_id: user.user_tier_id || 1,
        one_time_fee_amount: user.one_time_fee_amount || null,
        premium_option: null,
        plan: 'monthly',
      });
      
      // Set checkout URL when user data loads
      if (user.stripe_payment_link_id) {
        const url = `https://buy.stripe.com/${user.stripe_payment_link_id}`;
        setCurrentCheckoutUrl(url);
      }
    }
  }, [user]);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Auto-clear copied URL
  useEffect(() => {
    if (copiedUrl) {
      const t = setTimeout(() => setCopiedUrl(null), 2000);
      return () => clearTimeout(t);
    }
  }, [copiedUrl]);

  // Handle profile type change
  const handleProfileTypeChange = (newProfileType) => {
    setForm(prev => ({
      ...prev,
      profile_type: newProfileType,
      user_tier_id: getTierFromProfileType(newProfileType),
      one_time_fee_amount: newProfileType === 'recommendations_only' ? prev.one_time_fee_amount : null,
      premium_option: newProfileType === 'premium_full' ? 'checkout' : null,
    }));
  };

  // Handle save with profile type transitions
  const handleSave = async () => {
    try {
      const payload = {
        id: +id,
        full_name: String(form.full_name || ''),
        status_message: String(form.status_message || ''),
        user_roles: Number(form.user_roles),
        active: Number(form.active),
        is_subscribed: Number(form.is_subscribed),
        profile_type: form.profile_type,
        user_tier_id: form.user_tier_id,
        one_time_fee_amount: form.one_time_fee_amount,
      };

      if (form.profile_type === 'premium_full' && user.profile_type !== 'premium_full') {
        payload.plan = form.plan;
        payload.premium_option = form.premium_option;
      }

      if (form.profile_type === 'recommendations_only' && user.profile_type !== 'recommendations_only') {
        payload.one_time_fee_amount = form.one_time_fee_amount;
      }

      console.log('💾 Saving user with payload:', payload);

      const result = await updateUser(payload).unwrap();

      if (result.checkout_url) {
        setCurrentCheckoutUrl(result.checkout_url);
        
        setPaymentLinkData({
          checkoutUrl: result.checkout_url,
          userEmail: result.email,
          userName: result.full_name || result.email,
          profileType: result.profile_type,
          tier: result.user_tier_id,
          note: result.note || 'Profile type changed - payment link generated',
        });
        setShowPaymentLinkModal(true);
        setFlash({ txt: 'User updated! Payment link generated.', ok: true });
      } else {
        setFlash({ txt: 'User updated successfully!', ok: true });
      }

      setEditMode(false);
      await refetch();
    } catch (err) {
      console.error('Update failed:', err);
      setFlash({ txt: err?.data?.error || 'Failed to update user.', ok: false });
    }
  };

  // Retry payment link generation
  const handleRetryPayment = async () => {
    try {
      const result = await retryPayment({ id }).unwrap();
      
      if (result.checkout_url) {
        setCurrentCheckoutUrl(result.checkout_url);
        setFlash({ txt: 'Payment link regenerated successfully!', ok: true });
        console.log('💳 New Checkout URL:', result.checkout_url);
        await refetch();
      }
    } catch (err) {
      console.error('Retry payment failed:', err);
      setFlash({ txt: 'Failed to regenerate payment link', ok: false });
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (url, source = 'modal') => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(source);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Check if user has pending payment
  const hasPendingPayment = () => {
    if (!user) return false;
    return (
      (user.profile_type === 'recommendations_only' && user.one_time_payment_status === 'pending') ||
      (user.profile_type === 'premium_full' && user.one_time_payment_status === 'pending') ||
      (user.profile_type === 'premium_full' && !user.is_subscribed)
    );
  };

  const confirmDelete = () => setShowDeleteModal(true);
  const cancelDelete = () => setShowDeleteModal(false);

  const handleDelete = async () => {
    try {
      await deleteUser(id).unwrap();
      setFlash({ txt: 'User deleted successfully!', ok: true });
      setShowDeleteModal(false);
      setTimeout(() => navigate('/admin/users'), 500);
    } catch (err) {
      console.error('Delete failed:', err);
      setFlash({ txt: 'Failed to delete user.', ok: false });
      setShowDeleteModal(false);
    }
  };

  // Get profile badge
  const getProfileBadge = (profileType) => {
    const badges = {
      free: { color: 'bg-gray-600/20 text-gray-400', label: 'Free' },
      recommendations_only: { color: 'bg-orange-600/20 text-orange-400', label: 'Rec Only' },
      premium_full: { color: 'bg-purple-600/20 text-purple-400', label: 'Premium Full' },
    };
    return badges[profileType] || badges.free;
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-600/20 text-yellow-400', label: 'Payment Pending', icon: '⏳' },
      paid: { color: 'bg-green-600/20 text-green-400', label: 'Paid', icon: '✓' },
      failed: { color: 'bg-red-600/20 text-red-400', label: 'Failed', icon: '✗' },
      granted: { color: 'bg-blue-600/20 text-blue-400', label: 'Admin Granted', icon: '🎁' },
      converted: { color: 'bg-indigo-600/20 text-indigo-400', label: 'Converted', icon: '⬆️' },
    };
    return badges[status] || null;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 text-white">
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading user details...</div>
        </div>
      </div>
    );
  }
  
  // Error state
  if (isError || !user) {
    return (
      <div className="p-4 sm:p-6 text-white">
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">Failed to load user details.</p>
        </div>
      </div>
    );
  }
  
  // Wait for form initialization
  if (!form) return null;

  const profileBadge = getProfileBadge(user.profile_type);
  const paymentBadge = user.one_time_payment_status 
    ? getPaymentStatusBadge(user.one_time_payment_status) 
    : null;
  
  const showPaymentSection = hasPendingPayment() && currentCheckoutUrl;

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

      {/* Payment Link Modal */}
      <AnimatePresence>
        {showPaymentLinkModal && paymentLinkData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => {
              setShowPaymentLinkModal(false);
              if (paymentLinkData.checkoutUrl) {
                setCurrentCheckoutUrl(paymentLinkData.checkoutUrl);
              }
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border-2 border-green-600/30 shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">User Updated Successfully!</h3>
                    <p className="text-sm text-gray-400">Payment link generated</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    if (paymentLinkData.checkoutUrl) {
                      setCurrentCheckoutUrl(paymentLinkData.checkoutUrl);
                    }
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="bg-gray-900/50 rounded-lg p-4 mb-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">User:</span>
                  <span className="text-white font-medium">{paymentLinkData.userName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Email:</span>
                  <span className="text-white">{paymentLinkData.userEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Profile Type:</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    paymentLinkData.profileType === 'recommendations_only' 
                      ? 'bg-orange-600/20 text-orange-400' 
                      : 'bg-purple-600/20 text-purple-400'
                  }`}>
                    {paymentLinkData.profileType === 'recommendations_only' ? 'Recommendations Only' : 'Premium Full'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Tier:</span>
                  <span className="px-2 py-1 rounded text-xs bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
                    Tier {paymentLinkData.tier}
                  </span>
                </div>
                {paymentLinkData.note && (
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-blue-400">
                      <Info size={12} className="inline mr-1" />
                      {paymentLinkData.note}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  <LinkIcon size={14} className="inline mr-1" />
                  Payment Link (Share with user)
                </label>
                
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={paymentLinkData.checkoutUrl}
                      readOnly
                      className="flex-1 bg-transparent text-white text-sm outline-none select-all"
                      onClick={(e) => e.target.select()}
                    />
                    <button
                      onClick={() => copyToClipboard(paymentLinkData.checkoutUrl, 'modal')}
                      className={`px-3 py-1.5 rounded transition-all ${
                        copiedUrl === 'modal'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {copiedUrl === 'modal' ? (
                        <>
                          <CheckCircle size={14} className="inline mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={14} className="inline mr-1" />
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => window.open(paymentLinkData.checkoutUrl, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open Payment Link
                  </button>
                  <button
                    onClick={() => copyToClipboard(paymentLinkData.checkoutUrl, 'modal')}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>

                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-300 flex items-start gap-2">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Important:</strong> Share this payment link with the user via email or messaging.
                    </span>
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowPaymentLinkModal(false);
                    if (paymentLinkData.checkoutUrl) {
                      setCurrentCheckoutUrl(paymentLinkData.checkoutUrl);
                    }
                  }}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
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
            onClick={() => setEditMode(prev => !prev)}
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
              {(form.full_name || user.email || 'U').charAt(0).toUpperCase()}
            </div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2">
              {form.full_name || 'Unnamed User'}
            </h3>
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
                form.user_roles === 1 
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'bg-blue-600/20 text-blue-400'
              }`}>
                {form.user_roles === 1 ? 'Admin' : 'User'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${
                form.active 
                  ? 'bg-green-600/20 text-green-400' 
                  : 'bg-red-600/20 text-red-400'
              }`}>
                {form.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Profile Type:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${profileBadge.color}`}>
                {profileBadge.label}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Tier:</span>
              <span className="inline-flex px-2 py-1 text-xs rounded bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
                Tier {user.user_tier_id}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-sm">Subscribed:</span>
              <span className={`inline-flex px-2 py-1 text-xs rounded ${
                form.is_subscribed === 1
                  ? 'bg-emerald-600/20 text-emerald-400' 
                  : 'bg-gray-600/20 text-gray-400'
              }`}>
                {form.is_subscribed === 1 ? 'Yes' : 'No'}
              </span>
            </div>

            {paymentBadge && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Payment:</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${paymentBadge.color}`}>
                  <span>{paymentBadge.icon}</span>
                  {paymentBadge.label}
                </span>
              </div>
            )}
            
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

            {/* Payment Link Section */}
            {showPaymentSection && (
              <div className="pt-3 border-t border-gray-700">
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-yellow-400 text-xs font-semibold flex items-center gap-1">
                      <AlertCircle size={14} />
                      Payment Pending
                    </span>
                    <button
                      onClick={handleRetryPayment}
                      disabled={isRetrying}
                      className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded flex items-center gap-1 disabled:opacity-50 transition-colors"
                    >
                      <RefreshCw size={12} className={isRetrying ? 'animate-spin' : ''} />
                      {isRetrying ? 'Refreshing...' : 'Refresh Link'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-xs mb-1">Payment Link:</label>
                    <div className="bg-gray-900/50 rounded p-2">
                      <input
                        type="text"
                        value={currentCheckoutUrl}
                        readOnly
                        className="w-full bg-transparent text-white text-xs outline-none break-all"
                        onClick={(e) => e.target.select()}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => copyToClipboard(currentCheckoutUrl, 'profile')}
                      className="w-full text-xs px-3 py-1.5 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedUrl === 'profile' ? (
                        <>
                          <CheckCircle size={12} />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => window.open(currentCheckoutUrl, '_blank')}
                      className="w-full text-xs px-3 py-1.5 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 rounded flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink size={12} />
                      Open Payment
                    </button>
                  </div>

                  <p className="text-xs text-gray-400 flex items-start gap-1">
                    <Info size={10} className="mt-0.5 flex-shrink-0" />
                    <span>Share this link with the user to complete payment</span>
                  </p>
                </div>
              </div>
            )}
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
                    onChange={(e) => setForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                    placeholder="Enter full name"
                  />
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {form.full_name || '—'}
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

              {/* Profile Type */}
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-gray-400 mb-2 text-sm font-medium">
                  Profile Type
                  {editMode && (
                    <span className="ml-2 text-xs text-blue-400">
                      (Auto-assigns Tier {getTierFromProfileType(form.profile_type)})
                    </span>
                  )}
                </label>
                {editMode ? (
                  <select
                    value={form.profile_type}
                    onChange={(e) => handleProfileTypeChange(e.target.value)}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value="free">Free (Tier 1)</option>
                    <option value="recommendations_only">Recommendations Only (Tier 2)</option>
                    <option value="premium_full">Premium Full (Tier 3)</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {form.profile_type === 'free' && 'Free (Tier 1)'}
                    {form.profile_type === 'recommendations_only' && 'Recommendations Only (Tier 2)'}
                    {form.profile_type === 'premium_full' && 'Premium Full (Tier 3)'}
                  </div>
                )}
              </div>

              {/* CONDITIONAL: Recommendations Only Fields */}
              {editMode && form.profile_type === 'recommendations_only' && user.profile_type !== 'recommendations_only' && (
                <div className="col-span-1 sm:col-span-2 bg-orange-600/5 border border-orange-600/20 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
                    <CreditCard size={16} /> Recommendations Only Setup
                  </h5>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      One-Time Fee Amount * <span className="text-xs">(CAD)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      value={form.one_time_fee_amount || ''}
                      onChange={(e) => setForm(prev => ({ 
                        ...prev, 
                        one_time_fee_amount: e.target.value ? parseFloat(e.target.value) : null 
                      }))}
                      className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Info size={12} /> Payment link will be generated
                    </p>
                  </div>
                </div>
              )}

              {/* CONDITIONAL: Premium Full Fields */}
              {editMode && form.profile_type === 'premium_full' && user.profile_type !== 'premium_full' && (
                <div className="col-span-1 sm:col-span-2 bg-purple-600/5 border border-purple-600/20 rounded-lg p-4 space-y-4">
                  <h5 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                    <Zap size={16} /> Premium Full Setup
                  </h5>
                  
                  {/* Premium Option Selector */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Premium Access Type *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, premium_option: 'checkout' }))}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          form.premium_option === 'checkout'
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard size={14} className="text-blue-400" />
                          <span className="font-medium text-xs">Checkout</span>
                        </div>
                        <p className="text-xs text-gray-400">Regular checkout</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, premium_option: 'trial' }))}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          form.premium_option === 'trial'
                            ? 'border-green-500 bg-green-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={14} className="text-green-400" />
                          <span className="font-medium text-xs">30-Day Trial</span>
                        </div>
                        <p className="text-xs text-gray-400">Free trial</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, premium_option: 'free_access' }))}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          form.premium_option === 'free_access'
                            ? 'border-purple-500 bg-purple-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Gift size={14} className="text-purple-400" />
                          <span className="font-medium text-xs">Free Access</span>
                        </div>
                        <p className="text-xs text-gray-400">Admin granted</p>
                      </button>
                    </div>
                  </div>

                  {/* Plan Selector */}
                  {(form.premium_option === 'checkout' || form.premium_option === 'trial') && (
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Subscription Plan *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, plan: 'monthly' }))}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            form.plan === 'monthly'
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="text-center text-xs font-medium">Monthly</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm(prev => ({ ...prev, plan: 'annual' }))}
                          className={`p-2 rounded-lg border-2 transition-all ${
                            form.plan === 'annual'
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-gray-600 bg-gray-700/50'
                          }`}
                        >
                          <div className="text-center text-xs font-medium">Annual</div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Role */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Role</label>
                {editMode ? (
                  <select
                    value={form.user_roles}
                    onChange={(e) => setForm(prev => ({ ...prev, user_roles: +e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={0}>User</option>
                    <option value={1}>Admin</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {form.user_roles === 1 ? 'Admin' : 'User'}
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">Active Status</label>
                {editMode ? (
                  <select
                    value={form.active}
                    onChange={(e) => setForm(prev => ({ ...prev, active: +e.target.value }))}
                    className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                ) : (
                  <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                    {form.active ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>

              {/* Subscription Status */}
              <div>
                <label className="block text-gray-400 mb-2 text-sm font-medium">
                  Subscription Status
                </label>
                <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300">
                  {form.is_subscribed === 1 ? 'Subscribed' : 'Not Subscribed'}
                </div>
              </div>


              <div></div>
            </div>

            {/* Status Message */}
            <div>
              <label className="block text-gray-400 mb-2 text-sm font-medium">Status Message</label>
              {editMode ? (
                <textarea
                  value={form.status_message}
                  onChange={(e) => setForm(prev => ({ ...prev, status_message: e.target.value }))}
                  rows={3}
                  className="w-full p-3 bg-gray-700 rounded-lg text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  placeholder="Enter status message (optional)"
                />
              ) : (
                <div className="p-3 bg-gray-700/50 rounded-lg text-gray-300 min-h-[80px]">
                  {form.status_message || '—'}
                </div>
              )}
            </div>

            {/* Profile Type Change Warning */}
            {editMode && form.profile_type !== user.profile_type && (
              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3">
                <p className="text-xs text-yellow-300 flex items-start gap-2">
                  <Info size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Profile Type Change Detected:</strong> Changing from{' '}
                    <strong>{user.profile_type}</strong> to <strong>{form.profile_type}</strong>.
                    {(form.profile_type === 'premium_full' || form.profile_type === 'recommendations_only') && 
                      ' A payment link will be generated.'}
                  </span>
                </p>
              </div>
            )}

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
            <motion.div
              className="fixed inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelDelete}
            />
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
                  Are you sure you want to permanently delete{' '}
                  <strong className="text-white">{form.full_name || user.email}</strong>?
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
