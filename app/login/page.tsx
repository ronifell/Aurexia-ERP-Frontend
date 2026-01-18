'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import Image from 'next/image';
import PageModal from '@/components/PageModal';

const LoginPage = () => {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            console.log("=== LOGIN ATTEMPT START ===");
            console.log("Username:", username);
            console.log("Password length:", password.length);
            
            // Step 1: Login and get token
            console.log("Step 1: Calling login API...");
            const tokenData = await authAPI.login(username, password);
            console.log('✓ Login successful, token received:', tokenData);

            // Step 2: Store token in localStorage first
            console.log("Step 2: Storing token in localStorage...");
            localStorage.setItem('auth_token', tokenData.access_token);
            console.log('✓ Token stored. Token starts with:', tokenData.access_token.substring(0, 20));

            // Step 3: Fetch user data - the interceptor will add the token from localStorage
            console.log("Step 3: Fetching user data...");
            const userData = await authAPI.getCurrentUser();
            console.log('✓ User data fetched:', userData);

            // Step 4: Update store with user and token
            console.log("Step 4: Updating auth store...");
            setAuth(userData, tokenData.access_token);
            console.log('✓ Auth store updated');

            console.log("=== LOGIN SUCCESS ===");
            
            // Show success notification
            toast.success('Login successful!', {
                duration: 3000,
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                },
            });
            
            router.push('/dashboard');
        } catch (error: any) {
            console.error('=== LOGIN ERROR ===');
            console.error('Error object:', error);
            console.error('Error response:', error.response);
            console.error('Error response data:', error.response?.data);
            console.error('Error message:', error.message);
            
            // Extract error message from API response
            const errorMessage = error.response?.data?.detail || error.message || 'Login failed. Please try again.';
            console.log('Showing error notification:', errorMessage);
            
            // Show error notification (snackbar)
            toast.error(errorMessage, {
                duration: 4000,
                style: {
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid rgba(239, 68, 68, 0.6)',
                },
            });
            
            // Clear any partial data on error
            localStorage.removeItem('auth_token');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageModal showSidebar={false}>
            <div className="min-h-0 h-full flex items-center justify-center px-4 py-4 overflow-y-auto">
                <div className="max-w-md w-full my-auto">
                    {/* Logo and Title */}
                    <div className="text-center mb-6">
                        <div className="flex justify-center mb-5">
                            <Image
                                src="/logo.PNG"
                                alt="Aurexia"
                                width={130}
                                height={200}
                                className="brightness-110 object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold gold-text mb-1">AUREXIA</h1>
                        <p className="text-gray-400 text-sm">Enterprise Resource Planning</p>
                    </div>

                    {/* Login Form */}
                    <div className="card-aurexia p-5 md:p-6">
                        <h2 className="text-lg md:text-xl font-bold text-center mb-4 text-gray-100">
                            Login
                        </h2>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => {
                                        setUsername(e.target.value);
                                    }}
                                    required
                                    className="w-full px-3 py-1.5 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                                    placeholder="supervisor_aurexia"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-xs font-medium text-gray-300 mb-1.5">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                    }}
                                    required
                                    className="w-full px-3 py-1.5 text-sm bg-black/20 backdrop-blur-sm border border-yellow-500/30 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-100"
                                    placeholder="••••••••••"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full btn-aurexia py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Logging in...' : 'INGRESAR'}
                            </button>
                        </form>

                        <p className="mt-3 text-center text-xs text-gray-400">
                            ¿Olvidaste tu contraseña?
                        </p>
                    </div>

                    {/* Footer Text */}
                    <div className="mt-4 text-center text-xs text-gray-500">
                        <p>Traceability &amp; Real-Time Monitoring</p>
                        <p className="mt-1">MOAB / DIY /</p>
                    </div>
                </div>
            </div>
        </PageModal>
    );
};

export default LoginPage;
