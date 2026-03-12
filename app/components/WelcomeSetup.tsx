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
        <div className="min-h-screen flex items-center justify-center bg-obsidian-900 p-4 font-sans">
            <div className="max-w-2xl w-full bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-8 relative overflow-hidden">
                {/* Decorative Accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-electric-500 to-electric-600"></div>

                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-industrial-50 mb-2 uppercase tracking-wide">Welcome to Gym Ease</h1>
                    <p className="text-industrial-400 text-xs font-mono uppercase tracking-widest">[ SYSTEM INITIALIZATION ]</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                    {/* Gym Details Section */}
                    <div className="border border-obsidian-700/50 rounded-lg p-6 bg-obsidian-900/50">
                        <h2 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-6 border-l-2 border-electric-500 pl-2">Gym Details</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                    Gym Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.gymName}
                                    onChange={(e) => setFormData({ ...formData, gymName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
                                    placeholder="POWERFIT GYM"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                    Gym Address
                                </label>
                                <input
                                    type="text"
                                    value={formData.gymAddress}
                                    onChange={(e) => setFormData({ ...formData, gymAddress: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
                                    placeholder="123 MAIN STREET"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                        Gym Phone
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.gymPhone}
                                        onChange={(e) => setFormData({ ...formData, gymPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 font-mono focus:outline-none transition-colors"
                                        placeholder="1234567890"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                        Gym Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.gymEmail}
                                        onChange={(e) => setFormData({ ...formData, gymEmail: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 font-mono focus:outline-none transition-colors lowercase"
                                        placeholder="hello@gym.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Admin Account Section */}
                    <div className="border border-obsidian-700/50 rounded-lg p-6 bg-obsidian-900/50">
                        <h2 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-6 border-l-2 border-electric-500 pl-2">Admin Account</h2>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                    Your Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.adminName}
                                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
                                    placeholder="JOHN DOE"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 font-mono focus:outline-none transition-colors lowercase"
                                    placeholder="admin@gym.com"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={formData.adminPassword}
                                        onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 font-mono focus:outline-none tracking-widest transition-colors"
                                        placeholder="••••••••"
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.adminPhone}
                                        onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 font-mono focus:outline-none transition-colors"
                                        placeholder="9876543210"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full px-6 py-4 bg-electric-500 text-white rounded text-sm font-bold uppercase tracking-widest hover:bg-electric-600 focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 focus:ring-offset-obsidian-900 disabled:opacity-50 transition-all border border-transparent shadow-[0_0_20px_rgba(0,102,255,0.4)]"
                        >
                            {loading ? 'INITIALIZING SYSTEM...' : 'COMPLETE STARTUP SEQUENCE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
