'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LottieLoader from './LottieLoader';

declare global {
  interface Window {
    electronAPI?: {
      checkForUpdates: () => void;
      onUpdateStatus: (callback: (data: any) => void) => void;
      removeUpdateStatusListener: () => void;
    };
  }
}

const DEFAULT_WHATSAPP_TEMPLATE = `Hello {member_name},

This is a friendly reminder from *{gym_name}* regarding your membership fees.

*Payment Details:*
- Last Payment: {last_payment_date}
- Membership Expires: {subscription_end_date}
- Status: Payment Pending

Your payment is currently overdue. Please make the payment at your earliest convenience to continue enjoying our services without interruption.

Please visit the gym or contact us to complete your payment.

Thank you for your cooperation!

Best regards,
{gym_name} Team`;

interface GymSettingsData {
    gym_name: string;
    gym_email: string;
    gym_phone: string;
    gym_address: string;
    whatsapp_message_template: string;
}

export function GymSettings() {
    const { token } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [settings, setSettings] = useState<GymSettingsData>({
        gym_name: '',
        gym_email: '',
        gym_phone: '',
        gym_address: '',
        whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE,
    });

    useEffect(() => {
        if (token) fetchSettings();

        // Listen for update status
        if (window.electronAPI && window.electronAPI.onUpdateStatus) {
            window.electronAPI.onUpdateStatus((data: any) => {
                setIsCheckingUpdate(false);
                if (data.status === 'no-update') {
                    toast.success('You are on the latest version!');
                } else if (data.status === 'error') {
                    toast.error('Failed to check for updates: ' + data.message);
                } else if (data.status === 'update-available') {
                    // Native dialog will pop up, just stop loading
                }
            });
        }

        return () => {
            if (window.electronAPI && window.electronAPI.removeUpdateStatusListener) {
                window.electronAPI.removeUpdateStatusListener();
            }
        };
    }, [token]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setSettings(prev => ({
                    ...prev,
                    ...data,
                    whatsapp_message_template: data.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE,
                }));
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

    const handleCheckUpdate = () => {
        if (window.electronAPI) {
            setIsCheckingUpdate(true);
            window.electronAPI.checkForUpdates();
            toast.info('Checking for updates...');
        } else {
            toast.error('Updates can only be checked in the desktop app.');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <AnimatePresence>
                    <LottieLoader size={130} key="settings-loader" />
                </AnimatePresence>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 lg:p-8"
        >
            <div className="mb-8 border-b border-obsidian-700 pb-4 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-industrial-50 uppercase tracking-wide flex items-center gap-3">
                        <svg className="w-6 h-6 text-electric-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        </svg>
                        Gym Configuration
                    </h2>
                    <p className="text-industrial-400 mt-2 text-sm">Manage global settings for your fitness facility.</p>
                </div>
                <button
                    type="submit"
                    form="gym-settings-form"
                    disabled={saving}
                    className="shrink-0 px-8 py-3 bg-electric-500 text-white rounded font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-electric-600 transition-colors uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,102,255,0.2)] hover:shadow-[0_0_20px_rgba(0,102,255,0.4)]"
                >
                    {saving ? (
                        <>
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                            </svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Save Settings
                        </>
                    )}
                </button>
            </div>

            <form id="gym-settings-form" onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

                    {/* Left Column Wrapper */}
                    <div className="flex flex-col gap-8 h-full">
                        {/* Left column — General Settings */}
                        <div className="space-y-6 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg h-full">
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

                        <div className="pt-4 border-t border-obsidian-700/50 mt-6">
                            <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest mb-2">Application Updates</label>
                            <button
                                type="button"
                                onClick={handleCheckUpdate}
                                disabled={isCheckingUpdate}
                                className="w-full px-4 py-3 bg-obsidian-800 border border-obsidian-600 text-electric-400 rounded text-xs font-bold uppercase tracking-widest hover:border-electric-500 hover:text-electric-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCheckingUpdate ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                        </svg>
                                        Checking...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Check for Updates
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    </div> {/* End Left Column Wrapper */}

                <div className="h-full">
                    {/* Right column — WhatsApp Message Template */}
                    <div className="space-y-6 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
                        <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <span className="w-1 h-3 bg-green-500 rounded-sm inline-block"></span>
                            WhatsApp Message Template
                        </h3>

                        {/* Variables legend */}
                        <div className="bg-obsidian-800 border border-obsidian-600 rounded p-4">
                            <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-3">Available Variables</p>
                            <div className="flex flex-wrap gap-2">
                                {['{member_name}', '{gym_name}', '{last_payment_date}', '{subscription_end_date}'].map(v => (
                                    <span key={v} className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-mono rounded cursor-pointer hover:bg-green-500/20 transition-colors"
                                        onClick={() => {
                                            const el = document.getElementById('whatsapp-template-area') as HTMLTextAreaElement | null;
                                            if (!el) return;
                                            const start = el.selectionStart;
                                            const end = el.selectionEnd;
                                            const current = settings.whatsapp_message_template;
                                            setSettings(prev => ({
                                                ...prev,
                                                whatsapp_message_template: current.slice(0, start) + v + current.slice(end)
                                            }));
                                            setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + v.length; }, 0);
                                        }}
                                    >{v}</span>
                                ))}
                            </div>
                            <p className="text-[10px] text-industrial-500 mt-2">Click a variable to insert it at your cursor position.</p>
                        </div>

                        {/* Textarea */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Message Body</label>
                            <textarea
                                id="whatsapp-template-area"
                                name="whatsapp_message_template"
                                value={settings.whatsapp_message_template}
                                onChange={handleChange as any}
                                rows={12}
                                className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono resize-y"
                                placeholder="Enter your WhatsApp reminder message..."
                            />
                            <p className="text-[10px] text-industrial-500">Use *text* for bold in WhatsApp. Variables will be replaced with real data when the message is sent.</p>
                        </div>

                        {/* Actions row */}
                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPreview(p => !p)}
                                className="px-4 py-2 bg-obsidian-700 border border-obsidian-600 text-industrial-300 rounded text-xs font-bold uppercase tracking-widest hover:border-green-500 hover:text-green-400 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {showPreview ? 'Hide Preview' : 'Show Preview'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettings(prev => ({ ...prev, whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE }))}
                                className="px-4 py-2 bg-obsidian-700 border border-obsidian-600 text-industrial-300 rounded text-xs font-bold uppercase tracking-widest hover:border-yellow-500 hover:text-yellow-400 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                Reset to Default
                            </button>
                        </div>

                        {/* Live Preview */}
                        {showPreview && (
                            <div className="bg-[#0a1a10] border border-green-500/20 rounded-lg p-4">
                                <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    WhatsApp Preview (sample data)
                                </p>
                                <div className="bg-[#128C7E]/10 border border-[#128C7E]/20 rounded-lg p-4">
                                    <pre className="text-sm text-green-100 whitespace-pre-wrap font-sans leading-relaxed">
                                        {(settings.whatsapp_message_template || DEFAULT_WHATSAPP_TEMPLATE)
                                            .replace(/\{member_name\}/g, 'Rahul Sharma')
                                            .replace(/\{gym_name\}/g, settings.gym_name || 'Gym Ease')
                                            .replace(/\{last_payment_date\}/g, '01/04/2025')
                                            .replace(/\{subscription_end_date\}/g, '30/04/2025')}
                                    </pre>
                                </div>
                            </div>
                        )}
                    </div>
                </div> {/* end of right column / wrapper */}
            </div> {/* end 2-col grid */}

            </form>
            <div className="mt-12 pt-4 opacity-5 pointer-events-none select-none text-[8px] font-mono uppercase tracking-[0.5em] text-industrial-600 flex justify-between">
                <span>NODE_ID: PX_{Math.random().toString(36).substring(7).toUpperCase()}</span>
                <span>STATUS: PARALLAX_CONNECTED</span>
            </div>
        </motion.div>
    );
}
