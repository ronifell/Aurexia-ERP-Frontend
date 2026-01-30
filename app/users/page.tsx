'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { usersAPI } from '@/lib/api';
import { User, Role } from '@/lib/types';
import { Plus, Search, Edit, Trash2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const UsersPage = () => {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    badge_id: '',
    role_id: '',
  });
  const [editFormData, setEditFormData] = useState({
    email: '',
    full_name: '',
    badge_id: '',
    role_id: '',
    is_active: true,
    password: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const [usersData, rolesData] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getRoles(),
      ]);
      setUsers(usersData);
      setRoles(rolesData);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error('Access denied. Admin or Management role required.');
        router.push('/dashboard');
      } else {
        toast.error('Failed to load users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userData = {
        ...formData,
        role_id: formData.role_id ? parseInt(formData.role_id) : undefined,
      };
      
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create user');
      }

      toast.success('User created successfully!');
      setShowCreateModal(false);
      setFormData({
        username: '',
        password: '',
        email: '',
        full_name: '',
        badge_id: '',
        role_id: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      email: user.email || '',
      full_name: user.full_name || '',
      badge_id: user.badge_id || '',
      role_id: user.role_id?.toString() || '',
      is_active: user.is_active,
      password: '',
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const updateData: any = {
        email: editFormData.email || null,
        full_name: editFormData.full_name || null,
        badge_id: editFormData.badge_id || null,
        role_id: editFormData.role_id ? parseInt(editFormData.role_id) : null,
        is_active: editFormData.is_active,
      };

      // Only include password if it's provided
      if (editFormData.password) {
        updateData.password = editFormData.password;
      }

      await usersAPI.update(selectedUser.id, updateData);
      toast.success('User updated successfully!');
      setShowEditModal(false);
      setSelectedUser(null);
      setEditFormData({
        email: '',
        full_name: '',
        badge_id: '',
        role_id: '',
        is_active: true,
        password: '',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to update user');
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;

    try {
      await usersAPI.delete(selectedUser.id);
      toast.success('User deleted successfully!');
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || error.message || 'Failed to delete user');
      setShowDeleteConfirm(false);
      setSelectedUser(null);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (roleName?: string) => {
    switch (roleName) {
      case 'Admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Management': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'Quality': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Operator': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading users...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="h-full overflow-y-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-text mb-2">User Management</h1>
            <p className="text-gray-400">Manage users and role assignments</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="btn-aurexia flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New User</span>
          </button>
        </div>

        {/* Roles Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
          {roles.map((role) => (
            <div key={role.id} className="card-aurexia p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Shield className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-semibold text-gray-200">{role.name}</h3>
              </div>
              <p className="text-xs text-gray-400">
                {role.can_view_prices ? '💰 Can view prices' : '🚫 No price access'}
              </p>
              <p className="text-lg font-bold text-yellow-400 mt-2">
                {users.filter(u => u.role?.id === role.id).length}
              </p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by username, email, or full name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="card-aurexia p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-yellow-500/20">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Username</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Full Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Badge ID</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Role</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Price Access</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Active</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-yellow-500/5">
                    <td className="py-3 px-4 text-gray-200 font-medium">{user.username}</td>
                    <td className="py-3 px-4 text-gray-300">{user.full_name || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">{user.email || '-'}</td>
                    <td className="py-3 px-4 text-gray-300">
                      <code className="text-xs bg-gray-800 px-2 py-1 rounded">
                        {user.badge_id || '-'}
                      </code>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadgeClass(user.role?.name)}`}>
                          {user.role?.name || 'No Role'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {user.role?.can_view_prices ? (
                        <span className="text-green-400">✓ Yes</span>
                      ) : (
                        <span className="text-red-400">✗ No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`w-3 h-3 rounded-full ${user.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center space-x-2">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-2 hover:bg-yellow-500/10 rounded-lg text-gray-400 hover:text-yellow-400 transition-colors"
                          title="Edit user"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card-aurexia p-4">
            <p className="text-gray-400 text-sm">Total Users</p>
            <p className="text-2xl font-bold text-yellow-400">{users.length}</p>
          </div>
          <div className="card-aurexia p-4">
            <p className="text-gray-400 text-sm">Active Users</p>
            <p className="text-2xl font-bold text-green-400">
              {users.filter(u => u.is_active).length}
            </p>
          </div>
          <div className="card-aurexia p-4">
            <p className="text-gray-400 text-sm">Total Roles</p>
            <p className="text-2xl font-bold text-blue-400">{roles.length}</p>
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">Create New User</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="operator1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="••••••••"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Badge ID (for QR scanning)
                  </label>
                  <input
                    type="text"
                    value={formData.badge_id}
                    onChange={(e) => setFormData({...formData, badge_id: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="OP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role *
                  </label>
                  <select
                    required
                    value={formData.role_id}
                    onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  >
                    <option value="">Select a role...</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.can_view_prices ? '(Can view prices)' : '(No price access)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setFormData({
                        username: '',
                        password: '',
                        email: '',
                        full_name: '',
                        badge_id: '',
                        role_id: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-2"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-100 mb-6">Edit User: {selectedUser.username}</h2>
              
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.full_name}
                    onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="user@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Badge ID (for QR scanning)
                  </label>
                  <input
                    type="text"
                    value={editFormData.badge_id}
                    onChange={(e) => setEditFormData({...editFormData, badge_id: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="OP001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={editFormData.role_id}
                    onChange={(e) => setEditFormData({...editFormData, role_id: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  >
                    <option value="">No Role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.can_view_prices ? '(Can view prices)' : '(No price access)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                    className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                    placeholder="••••••••"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editFormData.is_active}
                    onChange={(e) => setEditFormData({...editFormData, is_active: e.target.checked})}
                    className="w-4 h-4 text-yellow-500 bg-black/50 border-yellow-500/30 rounded focus:ring-yellow-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-300">
                    Active
                  </label>
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                      setEditFormData({
                        email: '',
                        full_name: '',
                        badge_id: '',
                        role_id: '',
                        is_active: true,
                        password: '',
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-aurexia py-2"
                  >
                    Update User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="card-aurexia p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-red-400 mb-4">Delete User</h2>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete user <strong className="text-gray-100">{selectedUser.username}</strong>? 
                This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </PageModal>
  );
};

export default UsersPage;
