'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageModal from '@/components/PageModal';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { User } from '@/lib/types';
import { User as UserIcon, Save, Lock, Mail, UserCircle, Badge } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const router = useRouter();
  const { user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    badge_id: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    loadUserData();
  }, [router]);

  const loadUserData = async () => {
    try {
      const userData = await authAPI.getCurrentUser();
      setFormData({
        email: userData.email || '',
        full_name: userData.full_name || '',
        badge_id: userData.badge_id || '',
        password: '',
        confirmPassword: '',
      });
      // Update auth store with user data
      const token = localStorage.getItem('auth_token');
      if (token) {
        setAuth(userData, token);
      }
    } catch (error: any) {
      // Don't show error toast if it's a 401 - the interceptor will handle redirect
      if (error.response?.status !== 401) {
        toast.error('Failed to load user information');
      }
      // Only redirect if token is actually missing (not just expired)
      if (error.response?.status === 401 && !localStorage.getItem('auth_token')) {
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password if provided
    if (formData.password) {
      if (formData.password.length < 6) {
        toast.error('Password must be at least 6 characters long');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setSaving(true);
    try {
      const updateData: {
        email?: string;
        full_name?: string;
        badge_id?: string;
        password?: string;
      } = {};

      if (formData.email !== (user?.email || '')) {
        updateData.email = formData.email || undefined;
      }
      if (formData.full_name !== (user?.full_name || '')) {
        updateData.full_name = formData.full_name || undefined;
      }
      if (formData.badge_id !== (user?.badge_id || '')) {
        updateData.badge_id = formData.badge_id || undefined;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Only send update if there are changes
      if (Object.keys(updateData).length === 0) {
        toast('No changes to save');
        setSaving(false);
        return;
      }

      const updatedUser = await authAPI.updateProfile(updateData);
      // Update auth store with updated user data
      const token = localStorage.getItem('auth_token');
      if (token) {
        setAuth(updatedUser, token);
      }
      toast.success('Profile updated successfully!');
      
      // Clear password fields after successful update
      setFormData({
        ...formData,
        password: '',
        confirmPassword: '',
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageModal>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Loading profile...</p>
          </div>
        </div>
      </PageModal>
    );
  }

  return (
    <PageModal>
      <div className="h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold gold-text mb-2">My Profile</h1>
            <p className="text-gray-400">Update your personal information and account settings</p>
          </div>

          {/* User Info Card */}
          <div className="card-aurexia p-6 mb-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <UserIcon className="w-8 h-8 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-100">{user?.username}</h2>
                <p className="text-gray-400">{user?.role?.name || 'No Role'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">User ID</p>
                <p className="text-gray-200 font-medium">{user?.id}</p>
              </div>
              <div className="p-4 bg-black/30 rounded-lg">
                <p className="text-sm text-gray-400 mb-1">Account Status</p>
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${user?.is_active ? 'bg-green-400' : 'bg-red-400'}`}></span>
                  <p className="text-gray-200 font-medium">{user?.is_active ? 'Active' : 'Inactive'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="card-aurexia p-6">
            <h3 className="text-xl font-semibold text-gray-100 mb-6 flex items-center space-x-2">
              <UserCircle className="w-5 h-5 text-yellow-400" />
              <span>Edit Profile Information</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <UserCircle className="w-4 h-4" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  placeholder="John Doe"
                />
              </div>

              {/* Badge ID */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center space-x-2">
                  <Badge className="w-4 h-4" />
                  <span>Badge ID (for QR scanning)</span>
                </label>
                <input
                  type="text"
                  value={formData.badge_id}
                  onChange={(e) => setFormData({...formData, badge_id: e.target.value})}
                  className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                  placeholder="OP001"
                />
                <p className="mt-1 text-xs text-gray-500">Used for QR code scanning operations</p>
              </div>

              {/* Password Section */}
              <div className="pt-4 border-t border-gray-700">
                <h4 className="text-sm font-medium text-gray-300 mb-4 flex items-center space-x-2">
                  <Lock className="w-4 h-4" />
                  <span>Change Password</span>
                </h4>
                <p className="text-xs text-gray-500 mb-4">Leave blank if you don't want to change your password</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 bg-black/50 border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-aurexia py-2 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Info Note */}
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-300">
              <strong>Note:</strong> You can only update your email, full name, badge ID, and password. 
              Username, role, and account status can only be changed by administrators.
            </p>
          </div>
        </div>
      </div>
    </PageModal>
  );
};

export default ProfilePage;
