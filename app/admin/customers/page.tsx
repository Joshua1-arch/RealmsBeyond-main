"use client";
import React, { useState, useEffect } from "react";
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { MdErrorOutline, MdCheckCircle } from 'react-icons/md';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { useDebounce } from "@/hooks/useDebounce";
import { FiSearch, FiUser, FiCalendar, FiPhone, FiAlertTriangle, FiEye, FiX, FiCheck, FiXCircle, FiTrash2 } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import { UserDetailModal } from '@/components/admin/UserDetailModal';


interface User {
  _id: string;
  id?: string;
  full_name?: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  /** ID of the user pending deletion — drives the inline confirm dialog */
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null);


  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/users');
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (err: unknown) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /** Opens the styled inline confirm dialog — no browser confirm() */
  const handleDelete = (id: string) => {
    setConfirmTarget(id);
  };

  /** Called when the user clicks "Confirm Delete" inside the inline dialog */
  const confirmDelete = async () => {
    if (!confirmTarget) return;
    const id = confirmTarget;
    setConfirmTarget(null);

    try {
      setActionLoading(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      setSuccess('User deleted successfully');
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error deleting user:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };


  const handleRoleChange = async (id: string, newRole: string) => {
    try {
      setActionLoading(id);
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update role');
      }

      setSuccess(`User role updated to ${newRole}`);
      await fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      console.error('Error updating role:', err);
      setError(err instanceof Error ? err.message : 'Failed to update role. Please try again.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter based on debounced search
  const filteredUsers = users.filter(
    u =>
      (u.full_name?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false) ||
      u.role.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      (u.email?.toLowerCase().includes(debouncedSearch.toLowerCase()) || false)
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <main className="p-6 lg:p-10">
        <div className="mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 flex items-center gap-3">
                Customers
                <span className="text-sm font-normal text-gray-600 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  {users.length} total
                </span>
              </h1>
              <p className="text-gray-500 mt-1">Manage user roles and access.</p>
            </div>
            {loading && <AiOutlineLoading3Quarters className="animate-spin text-rare-primary h-6 w-6" />}
          </div>

          {/* Filters & Search - Toolbar */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 w-full md:w-auto">
              {/* Placeholders for future filters */}
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative group w-full md:w-64">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-rare-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-rare-primary/20 focus:border-rare-primary focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <MdErrorOutline className="h-5 w-5 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <MdCheckCircle className="h-5 w-5 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            {loading && users.length === 0 ? (
              <div className="p-12 flex justify-center">
                <AiOutlineLoading3Quarters className="h-8 w-8 animate-spin text-rare-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="p-4 font-heading font-normal text-gray-600 uppercase text-xs tracking-wider">User</th>
                      <th className="p-4 font-heading font-normal text-gray-600 uppercase text-xs tracking-wider">Role</th>
                      <th className="p-4 font-heading font-normal text-gray-600 uppercase text-xs tracking-wider">Contact</th>
                      <th className="p-4 font-heading font-normal text-gray-600 uppercase text-xs tracking-wider">Joined</th>
                      <th className="p-4 font-heading font-normal text-gray-600 uppercase text-xs tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                      <tr key={user._id || user.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                              {user.full_name ? user.full_name.charAt(0).toUpperCase() : <FiUser />}
                            </div>
                            <div>
                              <div className="font-bold text-gray-900">{user.full_name || 'N/A'}</div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange((user._id || user.id) as string, e.target.value)}
                            className="px-3 py-1 text-xs rounded-full border border-gray-200 bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-rare-primary/20 outline-none transition hover:bg-gray-50"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4 text-gray-500">
                          {user.phone ? (
                            <div className="flex items-center gap-2">
                              <FiPhone className="h-3 w-3" /> {user.phone}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="p-4 text-gray-500">
                          <div className="flex items-center gap-2">
                            <FiCalendar className="h-3 w-3" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setIsModalOpen(true);
                              }}
                              className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg shadow-sm transition-all flex items-center gap-2"
                            >
                              <FiEye className="h-3 w-3" />
                              View
                            </button>
                            <button
                              className="px-3 py-1.5 text-xs bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 hover:border-red-300 rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                              onClick={() => handleDelete((user._id || user.id) as string)}
                              disabled={actionLoading === (user._id || user.id)}
                            >
                              {actionLoading === (user._id || user.id) ? (
                                <AiOutlineLoading3Quarters className="h-3 w-3 animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-gray-500">
                          {debouncedSearch ? 'No users match your search.' : 'No users found.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main >

      {/* ── Inline Delete Confirmation Dialog ───────────────────────── */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setConfirmTarget(null)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Red top accent bar */}
            <div className="h-1 w-full bg-red-500" />

            <div className="p-6">
              {/* Icon + heading */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                  <FiAlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-gray-900 leading-tight">
                    Delete User
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to delete this user? This action cannot be undone.
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-100 my-4" />

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmTarget(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <UserDetailModal
        user={selectedUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
