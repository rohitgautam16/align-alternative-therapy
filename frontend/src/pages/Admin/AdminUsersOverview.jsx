// src/pages/Admin/AdminUsersOverview.jsx
import React, { useState, useEffect } from 'react';
import { useListUsersQuery, useCreateUserMutation } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { Grid3X3, List, Eye, Plus } from 'lucide-react';

export default function AdminUsersOverview() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [viewType, setViewType] = useState('grid'); // or 'list'
  const pageSize = 6;

  // Fetch paginated users
  const { data, isLoading, isError, error, refetch } =
    useListUsersQuery({ page, pageSize });

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

  // Success/Error banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Normalize response
  const users = Array.isArray(data?.data) ? data.data : [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  // Clear banners after 3s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const t = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg, errorMsg]);

  // Handlers
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser).unwrap();
      setSuccessMsg('User created successfully.');
      setNewUser({
        email: '',
        password: '',
        full_name: '',
        user_roles: 0,
        active: 1,
        status_message: ''
      });
      refetch();
    } catch (err) {
      console.error('Create user failed:', err);
      setErrorMsg('Failed to create user.');
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

  return (
    <div className="p-6 text-white">
      {/* Success/Error banners */}
      {successMsg && <div className="mb-4 p-2 bg-green-600 rounded">{successMsg}</div>}
      {errorMsg && <div className="mb-4 p-2 bg-red-600 rounded">{errorMsg}</div>}

      {/* Create New User Form */}
      <form
        onSubmit={handleCreate}
        className="mb-6 bg-gray-800 p-4 rounded-lg space-y-4"
      >
        <h3 className="text-lg font-medium text-white flex items-center gap-1">
          <Plus size={20} /> Create New User
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="email"
            placeholder="Email"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="password"
            placeholder="Password"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
            className="p-2 bg-gray-700 rounded text-white"
          />
          <input
            type="text"
            placeholder="Full Name"
            value={newUser.full_name}
            onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
            className="p-2 bg-gray-700 rounded text-white"
          />
          <select
            value={newUser.user_roles}
            onChange={(e) => setNewUser({ ...newUser, user_roles: +e.target.value })}
            className="p-2 bg-gray-700 rounded text-white"
          >
            <option value={0}>User</option>
            <option value={1}>Admin</option>
          </select>
          <select
            value={newUser.active}
            onChange={(e) => setNewUser({ ...newUser, active: +e.target.value })}
            className="p-2 bg-gray-700 rounded text-white"
          >
            <option value={1}>Active</option>
            <option value={0}>Inactive</option>
          </select>
          <input
            type="text"
            placeholder="Status Message"
            value={newUser.status_message}
            onChange={(e) => setNewUser({ ...newUser, status_message: e.target.value })}
            className="p-2 bg-gray-700 rounded text-white"
          />
        </div>
        <button
          type="submit"
          disabled={isCreating}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-white disabled:opacity-50"
        >
          {isCreating ? 'Creating...' : 'Create User'}
        </button>
      </form>

      {/* Header with Toggle */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">All Users</h2>
        <button
          onClick={toggleView}
          className="flex items-center gap-1 bg-gray-700 px-3 py-2 rounded hover:bg-gray-600"
        >
          {viewType === 'grid' ? <List size={18} /> : <Grid3X3 size={18} />}
          Toggle View
        </button>
      </div>

      {/* Loading/Error */}
      {isLoading && <p>Loading...</p>}
      {isError && (
        <p className="text-red-500">Error: {error?.data?.error || 'Failed to load users'}</p>
      )}

      {/* Users List/Grid */}
      <div
        className={`grid gap-4 ${
          viewType === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        }`}
      >
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 p-4 rounded shadow flex flex-col gap-2"
          >
            <div className="text-lg font-medium">{user.full_name}</div>
            <div className="text-sm text-gray-300">{user.email}</div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{user.user_roles === 1 ? 'Admin' : 'User'}</span>
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

      {/* Pagination */}
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
