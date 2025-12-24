import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useAdminPbGetAllUsersWithRecommendationsQuery,
} from '../../utils/api';
import { Search, Users, Plus, Eye, ChevronLeft, ChevronRight, User, Mail, Calendar, Crown, ArrowRight } from 'lucide-react';

// Utilities from your existing code
const cx = (...s) => s.filter(Boolean).join(' ');

const BTN_BASE =
  'inline-flex items-start justify-around gap-2 rounded px-3 py-3 cursor-pointer text-sm transition focus:outline-none focus-visible:ring-2 disabled:opacity-50';
const BTN_PRIMARY = 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400/60';
const BTN_SECONDARY = 'bg-blue-600 hover:bg-blue-500 text-white focus-visible:ring-blue-400/60';
const BTN_GHOST = 'bg-gray-700 hover:bg-gray-600 text-gray-100 focus-visible:ring-blue-400/60';
const BTN_LINK = 'text-gray-300 hover:text-white transition-colors';
const INPUT =
  'w-full px-3 py-2 rounded bg-[#0b1220] text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600';
const CARD =
  'rounded-xl bg-[#0b0f19] ring-1 ring-white/10 text-white shadow-[0_10px_50px_-20px_rgba(0,0,0,0.6)]';
const CARD_DIV = 'p-5';
const CARD_HEADER = 'flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-white/10';

// Simple toast hook
function useToast() {
  const [msg, setMsg] = useState('');
  return {
    Toast: () =>
      msg ? (
        <div className="fixed bottom-5 right-5 z-50">
          <div className="rounded bg-gray-700/90 px-4 py-2 ring-1 ring-white/10 text-white">
            <div className="text-sm">{msg}</div>
          </div>
        </div>
      ) : null,
    show: (m) => {
      setMsg(m);
      setTimeout(() => setMsg(''), 1600);
    },
  };
}

// Avatar component with first letter
function UserAvatar({ name, className = "" }) {
  const firstLetter = (name || '').charAt(0).toUpperCase();
  
  // Generate consistent color based on first letter
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-indigo-500',
    'bg-red-500',
    'bg-teal-500',
    'bg-orange-500',
    'bg-cyan-500'
  ];
  
  const colorIndex = firstLetter ? firstLetter.charCodeAt(0) % colors.length : 0;
  const bgColor = colors[colorIndex];
  
  return (
    <div className={cx(
      'flex items-center justify-center rounded-full text-white font-semibold',
      bgColor,
      className
    )}>
      {firstLetter || <User size={16} />}
    </div>
  );
}

// ✅ Updated cleaner user card
function UserCard({ user, onManageClick }) {
  const isActive = user.active === 1;
  const isSubscribed = user.is_subscribed === 1;
  const isAdmin = user.user_roles === 1;
  const createdDate = user.created_at ? new Date(user.created_at).toLocaleDateString() : '';

  return (
    <div className="p-6 rounded-2xl bg-[#0b0f19] ring-1 ring-white/10 transition-all duration-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.4)] group">
      {/* ✅ Header with Avatar */}
      <div className="flex items-start gap-4 mb-5">
        <UserAvatar 
          name={user.full_name} 
          className="w-12 h-12 text-lg flex-shrink-0"
        />
        
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0 flex-1">
              {/* ✅ Allow name to wrap */}
              <h3 className="font-semibold text-white text-lg leading-tight break-words">
                {user.full_name || '(No name)'}
              </h3>
              {/* ✅ Allow email to wrap */}
              <p className="text-gray-400 text-sm mt-1 flex items-start gap-2 break-all">
                <Mail size={14} className="flex-shrink-0 mt-0.5" />
                <span>{user.email}</span>
              </p>
            </div>
            
            {/* Admin Crown */}
            {isAdmin && (
              <Crown size={16} className="text-purple-400 flex-shrink-0" />
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>ID: {user.id}</span>
            {createdDate && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} />
                  {createdDate}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Recommendation Count */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-400">{user.recommendation_count}</span>
            <span className="text-gray-400 text-sm">
              {user.recommendation_count === 1 ? 'Recommendation' : 'Recommendations'}
            </span>
          </div>
        </div>
      </div>

      {/* ✅ Status Badges */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <span className={cx(
          'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium',
          isActive 
            ? 'bg-green-500/20 text-green-300 ring-1 ring-green-500/30' 
            : 'bg-red-500/20 text-red-300 ring-1 ring-red-500/30'
        )}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
        
        <span className={cx(
          'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium',
          isSubscribed 
            ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' 
            : 'bg-gray-600/50 text-gray-300 ring-1 ring-gray-600/50'
        )}>
          {isSubscribed ? 'Premium' : 'Free'}
        </span>

        {isAdmin && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30">
             Admin
          </span>
        )}
      </div>

      {/* ✅ Manage Button */}
      <button
        onClick={() => onManageClick(user)}
        className={cx(BTN_BASE, BTN_SECONDARY, 'w-full justify-start')}
      >
        {/* <Eye size={16} /> */}
        Manage Recommendations
        <ArrowRight size={16} />
      </button>
    </div>
  );
}

// Pagination component (unchanged)
function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  const showPages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(showPages / 2));
  let endPage = Math.min(totalPages, startPage + showPages - 1);
  
  if (endPage - startPage + 1 < showPages) {
    startPage = Math.max(1, endPage - showPages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={cx(BTN_BASE, BTN_GHOST)}
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className={cx(BTN_BASE, currentPage === 1 ? BTN_PRIMARY : BTN_GHOST)}
            >
              1
            </button>
            {startPage > 2 && <span className="text-gray-400 px-2">...</span>}
          </>
        )}

        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={cx(BTN_BASE, currentPage === page ? BTN_PRIMARY : BTN_GHOST)}
          >
            {page}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-400 px-2">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className={cx(BTN_BASE, currentPage === totalPages ? BTN_PRIMARY : BTN_GHOST)}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={cx(BTN_BASE, BTN_GHOST)}
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// Main component
export default function UserRecommendationsList() {
  const navigate = useNavigate();
  const { Toast, show } = useToast();

  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [sortBy, setSortBy] = useState('recent');

  // Fetch users with recommendations
  const { 
    data: response, 
    isLoading, 
    error,
    refetch 
  } = useAdminPbGetAllUsersWithRecommendationsQuery({
    page: currentPage,
    pageSize
  });

  const users = Array.isArray(response?.data) ? response.data : [];
  
  // ✅ Fixed total count - use data length if total is 0 or undefined (backend issue)
  const actualTotal = (response?.total && response.total > 0) ? response.total : users.length;
  const totalPages = Math.ceil(actualTotal / pageSize) || 1;

  // Filter and sort users (client-side for current page)
  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = users;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = users.filter(user => 
        (user.full_name || '').toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.id.toString().includes(query)
      );
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.full_name || '').localeCompare(b.full_name || '');
        case 'count':
          return (b.recommendation_count || 0) - (a.recommendation_count || 0);
        case 'recent':
        default:
          const aDate = new Date(a.updated_at || a.created_at || 0);
          const bDate = new Date(b.updated_at || b.created_at || 0);
          return bDate - aDate;
      }
    });

    return sorted;
  }, [users, searchQuery, sortBy]);

  // Handle user card click
  const handleUserClick = (user) => {
    navigate('/admin/personalize-basic', { 
      state: { selectedUser: user } 
    });
  };

  // Handle create new recommendation
  const handleCreateNew = () => {
    navigate('/admin/personalize-basic');
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ Simplified stats calculation
  const totalUsers = actualTotal;
  const totalRecommendations = users.reduce((sum, user) => sum + (user.recommendation_count || 0), 0);

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-400 mb-4">Error loading users: {error.message}</div>
        <button onClick={refetch} className={cx(BTN_BASE, BTN_GHOST)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users size={32} />
            User Recommendations
          </h1>
          <p className="text-gray-400 mt-2 text-lg">
            Manage personalized recommendations for your users
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className={cx(BTN_BASE, BTN_PRIMARY, 'text-base px-6 py-3')}
        >
          <Plus size={18} />
          Create New Recommendation
        </button>
      </div>

      {/* ✅ Simplified Stats Overview - Only 2 stats */}
      <section className={CARD}>
        <div className={CARD_DIV}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="text-center p-6 rounded-lg bg-white/5">
              <div className="text-4xl font-bold text-blue-400 mb-3">{totalUsers}</div>
              <div className="text-base text-gray-400">Total Users</div>
            </div>
            <div className="text-center p-6 rounded-lg bg-white/5">
              <div className="text-4xl font-bold text-green-400 mb-3">{totalRecommendations}</div>
              <div className="text-base text-gray-400">Total Recommendations</div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Filters and Search */}
      <section className={CARD}>
        <div className={CARD_DIV}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Search */}
            <div className="lg:col-span-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  className={cx(INPUT, 'pl-12 py-3 text-base')}
                  placeholder="Search by name, email, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Sort */}
            <div className="lg:col-span-4">
              <select
                className="px-4 py-3 rounded bg-[#0b1220] text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-600 w-full text-base"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="recent">Recent Activity</option>
                <option value="name">Name A-Z</option>
                <option value="count">Most Recommendations</option>
              </select>
            </div>
          </div>

          {/* Results summary */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="text-sm text-gray-400">
              Showing {filteredAndSortedUsers.length} of {users.length} users
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
            <div className="text-sm text-gray-400">
              {totalUsers} total users
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Users Grid */}
      <section>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[#0b0f19] ring-1 ring-white/10">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-full animate-pulse" />
                    <div className="flex-1">
                      <div className="h-5 bg-white/10 rounded animate-pulse mb-2" />
                      <div className="h-4 bg-white/10 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                  <div className="h-16 bg-white/10 rounded animate-pulse" />
                  <div className="h-10 bg-white/10 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className={CARD}>
            <div className={CARD_DIV}>
              <div className="text-center py-16">
                <Users size={64} className="mx-auto text-gray-600 mb-6" />
                <div className="text-xl font-medium text-gray-300 mb-3">
                  {users.length === 0 ? 'No users with recommendations yet' : 'No users found'}
                </div>
                <div className="text-gray-400 mb-8 max-w-md mx-auto">
                  {users.length === 0 
                    ? 'Start by creating a recommendation for a user to see them listed here.'
                    : 'Try adjusting your search criteria or check your filters.'
                  }
                </div>
                <button
                  onClick={handleCreateNew}
                  className={cx(BTN_BASE, BTN_PRIMARY, 'text-base px-6 py-3')}
                >
                  <Plus size={18} />
                  Create First Recommendation
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
              {filteredAndSortedUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  onManageClick={handleUserClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </section>

      <Toast />
    </div>
  );
}
