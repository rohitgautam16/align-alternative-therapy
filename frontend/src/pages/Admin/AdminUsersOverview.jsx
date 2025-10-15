// src/pages/Admin/AdminUsersOverview.jsx
import React, { useState, useEffect } from 'react';
import { useListUsersQuery, useCreateUserMutation } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';


export default function AdminUsersOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const pageSize = 6;


  // Fetch paginated users with search - RTK Query automatically refetches when params change
  const { data, isLoading, isError, error, refetch } = useListUsersQuery({ 
    page, 
    pageSize,
    search: searchTerm // Backend handles search now
  });

  console.log('📊 API Response:', data);

  // Create new user mutation
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();


  // New user form state
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    user_roles: 0,
    active: 1,
    status_message: ''
  });


  // Flash messages state
  const [flash, setFlash] = useState({ txt: '', ok: true });


  // Normalize response - NO MORE CLIENT-SIDE FILTERING
  const users = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);


  // Reset page to 1 when search term changes
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


  // Create user handler
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser).unwrap();
      setFlash({ txt: 'User created successfully!', ok: true });
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        user_roles: 0,
        active: 1,
        status_message: ''
      });
      setShowCreateForm(false);
      refetch();
    } catch (err) {
      console.error('Create user failed:', err);
      setFlash({ txt: 'Failed to create user.', ok: false });
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
    setPage(1); // Reset to first page
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
        {/* Show search results indicator */}
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


              <div>
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


      {/* Users Display - Using 'users' directly (backend filtered) */}
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
              {users.map((user) => (
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
                  {/* Left pane (text + buttons) */}
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
                      </div>
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


                  {/* Right pane (avatar placeholder) */}
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
              ))}
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
