import React, { useState, useEffect } from 'react';
import { useGetAdminsQuery } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Search, X, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function AdminAdminsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(() => {
    const saved = sessionStorage.getItem('adminAdminsPage');
    return saved ? Number(saved) : 1;
  });
  const [viewType, setViewType] = useState('grid');
  const pageSize = 6;


  const [searchTerm, setSearchTerm] = useState('');


  useEffect(() => {
    sessionStorage.setItem('adminAdminsPage', String(page));
  }, [page]);


  useEffect(() => {
    if (searchTerm !== '') setPage(1);
  }, [searchTerm]);

  // API call (kept exactly the same)
  const { data, isLoading, isError, error, refetch } =
    useGetAdminsQuery({ page, pageSize });

  // Data processing (kept exactly the same)
  const admins = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Flash messages state
  const [flash, setFlash] = useState({ txt: '', ok: true });

  // Filter admins based on search (client-side)
  const filteredAdmins = React.useMemo(() => {
    if (!searchTerm) return admins;
    
    return admins.filter(admin => 
      admin.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [admins, searchTerm]);

  // Auto-clear flash messages
  useEffect(() => {
    if (flash.txt) {
      const timeout = setTimeout(() => setFlash({ txt: '', ok: true }), 3000);
      return () => clearTimeout(timeout);
    }
  }, [flash]);

  // Handlers (kept exactly the same)
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
          <div className="flex items-center gap-2 mb-2">
            <Shield className="text-purple-400" size={24} />
            <h2 className="text-xl sm:text-2xl font-semibold">Admin Users Only</h2>
          </div>
          <p className="text-gray-400 text-sm">
            {total} admin user{total !== 1 ? 's' : ''} total
            {searchTerm && `, ${filteredAdmins.length} shown (filtered)`}
          </p>
        </div>
        
        <button
          onClick={toggleView}
          className="flex items-center gap-2 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600 transition-colors w-full sm:w-auto justify-center"
        >
          {viewType === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
          <span>{viewType === 'grid' ? 'List View' : 'Grid View'}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-gray-800 p-3 sm:p-4 rounded-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search admin users by name or email..."
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
      </div>

      {/* Loading/Error States */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-400">Loading admin users...</div>
        </div>
      )}

      {isError && (
        <div className="bg-red-900/20 border border-red-600 p-4 rounded">
          <p className="text-red-400">
            Error: {error?.data?.error || 'Failed to load admin users'}
          </p>
        </div>
      )}

      {/* Admin Users Flex Layout - 2 Column */}
      {!isLoading && !isError && (
        <>
          {filteredAdmins.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {admins.length === 0 ? 'No admin users found' : 'No admin users match your search'}
            </div>
          ) : (
            <div className={`
              ${viewType === 'grid' 
                ? 'flex flex-wrap gap-3 sm:gap-4' 
                : 'flex flex-col gap-3 sm:gap-4'
              }
            `}>
              {filteredAdmins.map((admin) => (
                <motion.div
                  key={admin.id}
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
                        {admin.full_name || 'Unnamed Admin'}
                      </h3>
                      <p className="text-sm md:text-md text-gray-400 truncate mb-1">
                        {admin.email}
                      </p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">
                        Admin ID: {admin.id}
                      </p>
                      
                      {/* Admin badges */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-600/20 text-purple-400 text-xs rounded">
                          <Shield size={12} />
                          Admin
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${
                          admin.active 
                            ? 'bg-green-600/20 text-green-400' 
                            : 'bg-red-600/20 text-red-400'
                        }`}>
                          {admin.active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs rounded ${
                          admin.is_subscribed 
                            ? 'bg-emerald-600/20 text-emerald-400'
                            : 'bg-red-600/20 text-gray-400'
                        }`}>
                          {admin.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-3 md:mt-4 flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => navigate(`/admin/users/${admin.id}`)}
                        className="text-blue-400 hover:underline flex items-center gap-1 text-sm whitespace-nowrap"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    </div>
                  </div>

                  {/* Right pane (avatar placeholder) */}
                  <div className="flex-shrink-0 w-full md:w-48 h-48 md:h-full">
                    <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-t-lg md:rounded-t-none md:rounded-r-lg flex items-center justify-center">
                      <div className="w-16 h-16 bg-purple-600/30 rounded-full flex items-center justify-center border-2 border-purple-400/30">
                        <Shield className="text-purple-400" size={24} />
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
