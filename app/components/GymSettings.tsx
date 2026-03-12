'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface GymSettingsData {
    gym_name: string;
    gym_email: string;
    gym_phone: string;
    gym_address: string;
}

export function GymSettings() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<GymSettingsData>({
        gym_name: '',
        gym_email: '',
        gym_phone: '',
        gym_address: '',
    });

    useEffect(() => {
        if (token) fetchSettings();
    }, [token]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(prev => ({ ...prev, ...data }));
            }
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const response = await fetch('/api/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast.success('Settings updated successfully');
            } else {
                toast.error('Failed to update settings');
            }
        } catch (error) {
            toast.error('Error updating settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setSettings({ ...settings, [name]: checked });
        } else {
            setSettings({ ...settings, [name]: value });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 lg:p-8 max-w-4xl mx-auto"
        >
            <div className="mb-8 border-b border-obsidian-700 pb-4">
                <h2 className="text-2xl font-bold text-industrial-50 uppercase tracking-wide flex items-center gap-3">
                    <svg className="w-6 h-6 text-electric-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    Gym Configuration
                </h2>
                <p className="text-industrial-400 mt-2 text-sm">Manage global settings for your fitness facility.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    <div className="space-y-6 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg shrink-0 col-span-1 md:col-span-2">
                        <h3 className="text-[10px] font-bold text-electric-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-electric-500 rounded-sm inline-block"></span>
                            General System Settings
                        </h3>
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Name</label>
                            <input
                                type="text"
                                name="gym_name"
                                value={settings.gym_name}
                                onChange={handleChange}
                                required
                                className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                                placeholder="Enter Gym Name"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Email</label>
                                <input
                                    type="email"
                                    name="gym_email"
                                    value={settings.gym_email || ''}
                                    onChange={handleChange}
                                    className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                                    placeholder="contact@gym.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Phone</label>
                                <input
                                    type="text"
                                    name="gym_phone"
                                    value={settings.gym_phone || ''}
                                    onChange={handleChange}
                                    className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Address</label>
                            <textarea
                                name="gym_address"
                                value={settings.gym_address || ''}
                                onChange={handleChange as any}
                                rows={3}
                                className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                                placeholder="123 Fitness Street..."
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-obsidian-700">
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-8 py-3 bg-electric-500 text-white rounded font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-electric-600 transition-colors uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,102,255,0.2)] hover:shadow-[0_0_20px_rgba(0,102,255,0.4)]"
                    >
                        {saving ? (
                            <>
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving System Config...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                Save General Settings
                            </>
                        )}
                    </button>
                </div>
            </form>
            <div className="mt-12 pt-4 opacity-5 pointer-events-none select-none text-[8px] font-mono uppercase tracking-[0.5em] text-industrial-600 flex justify-between">
                <span>NODE_ID: PX_{Math.random().toString(36).substring(7).toUpperCase()}</span>
                <span>STATUS: PARALLAX_CONNECTED</span>
            </div>
        </motion.div>
    );
}
