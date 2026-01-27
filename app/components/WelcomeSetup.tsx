'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function WelcomeSetup() {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        gymName: '',
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        adminPhone: '',
        gymAddress: '',
        gymPhone: '',
        gymEmail: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.gymName || !formData.adminName || !formData.adminEmail || !formData.adminPassword) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.adminPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gymName: formData.gymName,
                    adminName: formData.adminName,
                    adminEmail: formData.adminEmail,
                    adminPassword: formData.adminPassword,
                    adminPhone: formData.adminPhone || null,
                    gymAddress: formData.gymAddress || null,
                    gymPhone: formData.gymPhone || null,
                    gymEmail: formData.gymEmail || null
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Setup completed successfully! Redirecting to login...');
                // Reload the page to trigger setup check again
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                toast.error(data.error || 'Setup failed');
            }
        } catch (error) {
            console.error('Setup error:', error);
            toast.error('Failed to complete setup');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome to Gym Ease!</h1>
                    <p className="text-gray-600">Let's set up your gym management system</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Gym Details Section */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gym Details</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gym Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.gymName}
                                    onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="e.g., PowerFit Gym"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Gym Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.gymAddress}
                                    onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="123 Main Street, City"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gym Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.gymPhone}
                                        onChange={(e) => setFormData({ ...formData, gymPhone: e.target.value })}
                                        className="auth-input-field"
                                        placeholder="1234567890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Gym Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.gymEmail}
                                        onChange={(e) => setFormData({ ...formData, gymEmail: e.target.value })}
                                        className="auth-input-field"
                                        placeholder="info@gym.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Account Section */}
                    <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Account</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="admin@gym.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={formData.adminPassword}
                                    onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="Minimum 6 characters"
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.adminPhone}
                                    onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                                    className="auth-input-field"
                                    placeholder="9876543210"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="auth-button w-full"
                    >
                        {loading ? 'Setting up...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
}
