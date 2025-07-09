import React, { useState, useEffect } from 'react';
import { useGetAdminsQuery } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye } from 'lucide-react';

export default function AdminAdminsOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid');
  const pageSize = 6;

  const { data, isLoading, isError, error, refetch } =
    useGetAdminsQuery({ page, pageSize });

  const admins = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (successMsg || errorMsg) {
      const timeout = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [successMsg, errorMsg]);

  const toggleView = () => {
    setViewType((v) => (v === 'grid' ? 'list' : 'grid'));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  return (
    <div className="p-6 text-white">
      <h2 className="text-2xl font-semibold mb-4">Admin Users Only</h2>

      {successMsg && <div className="mb-4 p-2 bg-green-600 rounded">{successMsg}</div>}
      {errorMsg && <div className="mb-4 p-2 bg-red-600 rounded">{errorMsg}</div>}

      <div className="flex justify-between items-center mb-4">
        <p className="text-gray-300">Showing only users with admin role</p>
        <button
          onClick={toggleView}
          className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600"
        >
          {viewType === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          Toggle View
        </button>
      </div>

      {isLoading && <p>Loading...</p>}
      {isError && (
        <p className="text-red-500">
          Error: {error?.data?.error || 'Failed to load admin users'}
        </p>
      )}

      <div
        className={`grid gap-4 ${
          viewType === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {admins.map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 p-4 rounded shadow flex flex-col gap-2"
          >
            <div className="text-lg font-medium">{user.full_name}</div>
            <div className="text-sm text-gray-300">{user.email}</div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>Admin</span>
              <button
                className="flex items-center gap-1 text-blue-400 hover:underline"
                onClick={() => navigate(`/admin/users/${user.id}`)}
              >
                <Eye size={16} /> View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2">
          {page} / {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages}
          className="px-4 py-2 bg-gray-700 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
