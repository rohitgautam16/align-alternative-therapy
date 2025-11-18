// src/pages/Admin/AdminUsersOverview.jsx
import React, { useState, useEffect } from 'react';
import { useListUsersQuery, useCreateUserMutation, useRetryPaymentMutation } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus, Search, X, ExternalLink, Copy, CheckCircle, Info, RefreshCw, Zap, Gift, CreditCard, Link as LinkIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminUsersOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(() => {
  const saved = sessionStorage.getItem('adminUsersPage');
  return saved ? Number(saved) : 1;
});
  const [viewType, setViewType] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(null);
  const [retryingPayment, setRetryingPayment] = useState(null);
  
  // Payment Link Modal State
  const [showPaymentLinkModal, setShowPaymentLinkModal] = useState(false);
  const [paymentLinkData, setPaymentLinkData] = useState(null);
  
  const pageSize = 6;

  useEffect(() => {
  sessionStorage.setItem('adminUsersPage', String(page));
}, [page]);



useEffect(() => {
  if (searchTerm !== '') setPage(1);
}, [searchTerm]);


  // Fetch paginated users with search
  const { data, isLoading, isError, error, refetch } = useListUsersQuery({ 
    page, 
    pageSize,
    search: searchTerm
  });

  // Mutations
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [retryPayment] = useRetryPaymentMutation();

  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    user_roles: 0,
    active: 1,
    status_message: '',
    profile_type: 'free',
    one_time_fee_amount: null,
    premium_option: null,
    plan: 'monthly',
  });

  // Flash messages state
  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Normalize response
  const users = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Tier mapping
  const getTierFromProfileType = (profileType) => {
    const tierMap = {
      free: 1,
      recommendations_only: 2,
      premium_full: 3,
    };
    return tierMap[profileType] || 1;
  };

  // Reset page when search changes
  useEffect(() => {
    if (searchTerm !== '') {
      setPage(1);
    }
  }, [searchTerm]);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const t = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(t);
    }
  }, [flash]);

  // Auto-clear copied URL notification
  useEffect(() => {
    if (copiedUrl) {
      const t = setTimeout(() => setCopiedUrl(null), 2000);
      return () => clearTimeout(t);
    }
  }, [copiedUrl]);

  // Reset premium options when switching profile types
  const handleProfileTypeChange = (profileType) => {
    setNewUser({ 
      ...newUser, 
      profile_type: profileType,
      one_time_fee_amount: profileType === 'recommendations_only' ? newUser.one_time_fee_amount : null,
      premium_option: profileType === 'premium_full' ? 'checkout' : null,
      plan: profileType === 'premium_full' ? newUser.plan : 'monthly',
    });
  };

  // Create user handler with payment link handling
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const result = await createUser(newUser).unwrap();
      
      console.log('✅ User creation result:', result);
      
      // Check if checkout_url was returned
      if (result.checkout_url) {
        // Show payment link modal
        setPaymentLinkData({
          checkoutUrl: result.checkout_url,
          userEmail: result.email,
          userName: result.full_name || result.email,
          profileType: result.profile_type,
          tier: result.user_tier_id,
          note: result.note || null,
        });
        setShowPaymentLinkModal(true);
        
        setFlash({ 
          txt: `User created with Tier ${result.user_tier_id}! Payment link ready.`, 
          ok: true 
        });
      } else {
        setFlash({ 
          txt: `User created successfully with Tier ${result.user_tier_id}!${result.note ? ' (' + result.note + ')' : ''}`, 
          ok: true 
        });
      }
      
      // Reset form
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        user_roles: 0,
        active: 1,
        status_message: '',
        profile_type: 'free',
        one_time_fee_amount: null,
        premium_option: null,
        plan: 'monthly',
      });
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Create user failed:', err);
      setFlash({ 
        txt: err?.data?.error || 'Failed to create user.', 
        ok: false 
      });
    }
  };

  // Retry payment handler
  const handleRetryPayment = async (userId) => {
    setRetryingPayment(userId);
    try {
      const result = await retryPayment({ id: userId }).unwrap();
      
      if (result.checkout_url) {
        setFlash({ txt: 'Payment link regenerated!', ok: true });
        console.log('💳 New Checkout URL:', result.checkout_url);
        window.open(result.checkout_url, '_blank');
      }
      
      refetch();
    } catch (err) {
      console.error('Retry payment failed:', err);
      setFlash({ txt: 'Failed to regenerate payment link', ok: false });
    } finally {
      setRetryingPayment(null);
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl('modal');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const toggleView = () => {
    setViewType((v) => (v === 'grid' ? 'list' : 'grid'));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setPage(1);
  };

  // Copy checkout URL to clipboard
  const copyCheckoutUrl = async (url, userId) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(userId);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Get profile type badge color
  const getProfileTypeBadge = (profileType) => {
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
      pending: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', label: 'Payment Pending', icon: '⏳' },
      paid: { color: 'bg-green-600/20 text-green-400 border-green-600/30', label: 'Paid', icon: '✓' },
      failed: { color: 'bg-red-600/20 text-red-400 border-red-600/30', label: 'Failed', icon: '✗' },
      granted: { color: 'bg-blue-600/20 text-blue-400 border-blue-600/30', label: 'Admin Granted', icon: '🎁' },
    };
    return badges[status] || null;
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

      {/* Payment Link Modal */}
      <AnimatePresence>
        {showPaymentLinkModal && paymentLinkData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowPaymentLinkModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl border-2 border-green-600/30 shadow-xl"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-600/20 rounded-full flex items-center justify-center">
                    <CheckCircle size={24} className="text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">User Created Successfully!</h3>
                    <p className="text-sm text-gray-400">Payment link generated</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPaymentLinkModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              {/* User Info */}
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

              {/* Payment Link Section */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-300">
                  <LinkIcon size={14} className="inline mr-1" />
                  Payment Link (Share with user)
                </label>
                
                {/* URL Display */}
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
                      onClick={() => copyToClipboard(paymentLinkData.checkoutUrl)}
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={() => window.open(paymentLinkData.checkoutUrl, '_blank')}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <ExternalLink size={16} />
                    Open Payment Link
                  </button>
                  <button
                    onClick={() => copyToClipboard(paymentLinkData.checkoutUrl)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Copy size={16} />
                    Copy Link
                  </button>
                </div>

                {/* Info Banner */}
                <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 mt-4">
                  <p className="text-xs text-yellow-300 flex items-start gap-2">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Important:</strong> Share this payment link with the user via email or messaging. 
                      The link is persistent and won't expire. User can complete payment at any time.
                    </span>
                  </p>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowPaymentLinkModal(false)}
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
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Users Overview</h2>
          <p className="text-gray-400 text-sm">
            {total} user{total !== 1 ? 's' : ''} {searchTerm && 'found'}
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center justify-center gap-2 bg-blue-600 px-3 sm:px-4 py-2 rounded hover:bg-blue-500 flex-1 sm:flex-none text-sm sm:text-base"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">{showCreateForm ? 'Cancel' : 'Create User'}</span>
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
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 rounded text-white placeholder-gray-400 text-sm sm:text-base"
            />
          </div>
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="flex items-center justify-center gap-1 text-gray-400 hover:text-white text-sm px-3 py-2 sm:px-0 sm:py-0"
            >
              <X size={16} /> Clear
            </button>
          )}
        </div>
        {searchTerm && !isLoading && (
          <p className="text-gray-400 text-xs sm:text-sm mt-2">
            {total > 0 
              ? `Showing ${users.length} of ${total} result${total !== 1 ? 's' : ''} for "${searchTerm}"`
              : `No results for "${searchTerm}"`
            }
          </p>
        )}
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
              <Plus size={20} /> Create New User
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Basic Fields */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email *</label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Password *</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Your Name"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>

              {/* Profile Type with Auto-Tier Indicator */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                <label className="block text-gray-400 text-sm mb-1">
                  Profile Type * 
                  <span className="ml-2 text-xs text-blue-400">
                    (Auto-assigns Tier {getTierFromProfileType(newUser.profile_type)})
                  </span>
                </label>
                <select
                  value={newUser.profile_type}
                  onChange={(e) => handleProfileTypeChange(e.target.value)}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                >
                  <option value="free">Free (Tier 1)</option>
                  <option value="recommendations_only">Recommendations Only (Tier 2)</option>
                  <option value="premium_full">Premium Full (Tier 3)</option>
                </select>
              </div>

              {/* CONDITIONAL: Recommendations Only Fields */}
              {newUser.profile_type === 'recommendations_only' && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-orange-600/5 border border-orange-600/20 rounded-lg p-4 space-y-3">
                  <h4 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                    <CreditCard size={16} /> Recommendations Only Setup
                  </h4>
                  
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">
                      One-Time Fee Amount * <span className="text-xs">(CAD)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="10.00"
                      value={newUser.one_time_fee_amount || ''}
                      onChange={(e) => setNewUser({ 
                        ...newUser, 
                        one_time_fee_amount: e.target.value ? parseFloat(e.target.value) : null 
                      })}
                      required
                      className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Info size={12} /> Persistent payment link will be auto-generated
                    </p>
                  </div>
                </div>
              )}

              {/* CONDITIONAL: Premium Full Fields */}
              {newUser.profile_type === 'premium_full' && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 bg-purple-600/5 border border-purple-600/20 rounded-lg p-4 space-y-4">
                  <h4 className="text-sm font-semibold text-purple-400 flex items-center gap-2">
                    <Zap size={16} /> Premium Full Setup
                  </h4>
                  
                  {/* Premium Option Selector */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Premium Access Type *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Regular Checkout */}
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, premium_option: 'checkout' })}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newUser.premium_option === 'checkout'
                            ? 'border-blue-500 bg-blue-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard size={16} className="text-blue-400" />
                          <span className="font-medium text-sm">Checkout</span>
                        </div>
                        <p className="text-xs text-gray-400">Regular Stripe checkout link</p>
                      </button>

                      {/* Trial */}
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, premium_option: 'trial' })}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newUser.premium_option === 'trial'
                            ? 'border-green-500 bg-green-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Zap size={16} className="text-green-400" />
                          <span className="font-medium text-sm">30-Day Trial</span>
                        </div>
                        <p className="text-xs text-gray-400">Free trial via checkout</p>
                      </button>

                      {/* Free Access */}
                      <button
                        type="button"
                        onClick={() => setNewUser({ ...newUser, premium_option: 'free_access' })}
                        className={`p-3 rounded-lg border-2 transition-all text-left ${
                          newUser.premium_option === 'free_access'
                            ? 'border-purple-500 bg-purple-600/20'
                            : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Gift size={16} className="text-purple-400" />
                          <span className="font-medium text-sm">Free Access</span>
                        </div>
                        <p className="text-xs text-gray-400">Admin-granted $0 subscription</p>
                      </button>
                    </div>
                  </div>

                  {/* Plan Selector (only for checkout and trial) */}
                  {(newUser.premium_option === 'checkout' || newUser.premium_option === 'trial') && (
                    <div>
                      <label className="block text-gray-400 text-sm mb-1">Subscription Plan *</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setNewUser({ ...newUser, plan: 'monthly' })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            newUser.plan === 'monthly'
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium text-sm">Monthly</div>
                            <div className="text-xs text-gray-400 mt-1">Recurring monthly</div>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setNewUser({ ...newUser, plan: 'yearly' })}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            newUser.plan === 'yearly'
                              ? 'border-blue-500 bg-blue-600/20'
                              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-medium text-sm">Yearly</div>
                            <div className="text-xs text-gray-400 mt-1">Recurring yearly</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Info Messages */}
                  {newUser.premium_option === 'checkout' && (
                    <div className="bg-blue-600/10 border border-blue-600/30 rounded p-2 text-xs text-blue-300">
                      <Info size={12} className="inline mr-1" />
                      User will receive a Stripe checkout link for immediate payment
                    </div>
                  )}
                  {newUser.premium_option === 'trial' && (
                    <div className="bg-green-600/10 border border-green-600/30 rounded p-2 text-xs text-green-300">
                      <Zap size={12} className="inline mr-1" />
                      User gets 30 days free, then auto-charges after trial ends
                    </div>
                  )}
                  {newUser.premium_option === 'free_access' && (
                    <div className="bg-purple-600/10 border border-purple-600/30 rounded p-2 text-xs text-purple-300">
                      <Gift size={12} className="inline mr-1" />
                      User gets instant free premium access via $0 Stripe subscription
                    </div>
                  )}
                </div>
              )}

              {/* Standard Fields */}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Role</label>
                <select
                  value={newUser.user_roles}
                  onChange={(e) => setNewUser({ ...newUser, user_roles: +e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                >
                  <option value={0}>User</option>
                  <option value={1}>Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select
                  value={newUser.active}
                  onChange={(e) => setNewUser({ ...newUser, active: +e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                >
                  <option value={1}>Active</option>
                  <option value={0}>Inactive</option>
                </select>
              </div>

              <div className="col-span-1 sm:col-span-2 lg:col-span-1">
                <label className="block text-gray-400 text-sm mb-1">Status Message</label>
                <input
                  type="text"
                  placeholder="Optional status message"
                  value={newUser.status_message}
                  onChange={(e) => setNewUser({ ...newUser, status_message: e.target.value })}
                  className="w-full p-2 bg-gray-700 rounded text-white text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Tier Info Banner */}
            <div className="bg-blue-600/10 border border-blue-600/30 rounded p-3 flex items-start gap-2">
              <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-300">
                <strong>Auto-Tier Assignment:</strong> This user will be assigned to <strong>Tier {getTierFromProfileType(newUser.profile_type)}</strong> based on the selected profile type.
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
                disabled={isCreating}
                className="px-4 py-2 bg-blue-600 rounded disabled:opacity-50 hover:bg-blue-500 order-1 sm:order-2"
              >
                {isCreating ? 'Creating…' : 'Create User'}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Loading/Error */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading users...</div>
        </div>
      )}

      {isError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">
            Error: {error?.data?.error || 'Failed to load users'}
          </p>
        </div>
      )}

      {/* Users Display */}
      {!isLoading && !isError && (
        <>
          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchTerm 
                ? `No users found matching "${searchTerm}"` 
                : 'No users found'
              }
            </div>
          ) : (
            <div className={`
              ${viewType === 'grid' 
                ? 'flex flex-wrap gap-3 sm:gap-4' 
                : 'flex flex-col gap-3 sm:gap-4'
              }
            `}>
              {users.map((user) => {
                const profileBadge = getProfileTypeBadge(user.profile_type);
                const paymentBadge = user.one_time_payment_status 
                  ? getPaymentStatusBadge(user.one_time_payment_status) 
                  : null;

                const canRetryPayment = (
                  (user.profile_type === 'recommendations_only' && user.one_time_payment_status === 'pending') ||
                  (user.profile_type === 'premium_full' && !user.is_subscribed)
                );

                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`
                      bg-gray-800 rounded-lg flex flex-col-reverse md:flex-row h-auto md:h-48 overflow-hidden hover:bg-gray-750 transition-colors
                      ${viewType === 'grid' 
                        ? 'flex-[0_0_calc(50%-0.375rem)] sm:flex-[0_0_calc(50%-0.5rem)]' 
                        : 'w-full'
                      }
                    `}
                  >
                    {/* Left pane */}
                    <div className="flex-1 flex flex-col p-4 justify-between mt-4 md:mt-0 min-w-0">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-lg md:text-xl text-white truncate mb-1">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        <p className="text-sm md:text-md text-gray-400 truncate mb-1">
                          {user.email}
                        </p>
                        <p className="text-xs md:text-sm text-gray-500 truncate">
                          User Id: {user.id}
                        </p>
                        
                        {/* User badges */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            user.user_roles === 1 
                              ? 'bg-purple-600/20 text-purple-400' 
                              : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {user.user_roles === 1 ? 'Admin' : 'User'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${
                            user.active 
                              ? 'bg-green-600/20 text-green-400' 
                              : 'bg-red-600/20 text-red-400'
                          }`}>
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs rounded ${profileBadge.color}`}>
                            {profileBadge.label}
                          </span>
                          {paymentBadge && (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded border ${paymentBadge.color}`}>
                              <span>{paymentBadge.icon}</span>
                              {paymentBadge.label}
                            </span>
                          )}
                          {user.user_tier_id && (
                            <span className="inline-flex px-2 py-1 text-xs rounded bg-indigo-600/20 text-indigo-400 border border-indigo-600/30">
                              Tier {user.user_tier_id}
                            </span>
                          )}
                        </div>

                        {/* Fee/Plan Display */}
                        {user.profile_type === 'recommendations_only' && user.one_time_fee_amount && (
                          <div className="mt-2 text-xs text-gray-400">
                            Fee: <span className="text-white font-medium">${Number(user.one_time_fee_amount).toFixed(2)} CAD</span>
                          </div>
                        )}

                        {/* Payment Actions */}
                        {canRetryPayment && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {user.stripe_payment_link_id && (
                              <>
                                <button
                                  onClick={() => window.open(user.stripe_payment_link_url || `https://buy.stripe.com/${user.stripe_payment_link_id}`, '_blank')}
                                  className="text-xs px-2 py-1 bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 rounded flex items-center gap-1"
                                >
                                  <ExternalLink size={12} /> Open Payment
                                </button>
                                <button
                                  onClick={() => copyCheckoutUrl(user.stripe_payment_link_url || `https://buy.stripe.com/${user.stripe_payment_link_id}`, user.id)}
                                  className="text-xs px-2 py-1 bg-gray-700 text-gray-300 hover:bg-gray-600 rounded flex items-center gap-1"
                                >
                                  {copiedUrl === user.id ? <CheckCircle size={12} /> : <Copy size={12} />}
                                  {copiedUrl === user.id ? 'Copied!' : 'Copy Link'}
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleRetryPayment(user.id)}
                              disabled={retryingPayment === user.id}
                              className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                              <RefreshCw size={12} className={retryingPayment === user.id ? 'animate-spin' : ''} />
                              {retryingPayment === user.id ? 'Regenerating...' : 'Retry Payment'}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 md:mt-4 flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => navigate(`/admin/users/${user.id}`)}
                          className="text-blue-400 hover:underline flex items-center gap-1 text-sm whitespace-nowrap"
                        >
                          <Eye size={14} /> View Details
                        </button>
                      </div>
                    </div>

                    {/* Right pane (avatar) */}
                    <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-full">
                      <div className="w-full h-full bg-gray-700 rounded-t-lg md:rounded-t-none md:rounded-r-lg flex items-center justify-center">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-2xl font-semibold text-gray-300">
                            {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 sm:gap-4 mt-8">
              <button
                onClick={() => handlePageChange(page - 1)}
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
                      onClick={() => handlePageChange(pageNum)}
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
                onClick={() => handlePageChange(page + 1)}
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
