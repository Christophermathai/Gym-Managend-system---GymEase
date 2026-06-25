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

const BACKEND_URL = process.env.NEXT_PUBLIC_MESSAGE_BACKEND_URL || 'https://gymease-backend.vercel.app';

interface GymSettingsData {
  gym_name: string;
  gym_email: string;
  gym_phone: string;
  gym_address: string;
  whatsapp_message_template: string;
  whatsapp_mode: 'manual' | 'automated';
  api_key: string;
  available_credits: number;
}

export function GymSettings() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState<GymSettingsData>({
    gym_name: '',
    gym_email: '',
    gym_phone: '',
    gym_address: '',
    whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE,
    whatsapp_mode: 'manual',
    api_key: '',
    available_credits: 0,
  });

  useEffect(() => {
    if (token) fetchSettings();
    if (window.electronAPI?.onUpdateStatus) {
      window.electronAPI.onUpdateStatus((data: any) => {
        setIsCheckingUpdate(false);
        if (data.status === 'no-update') toast.success('You are on the latest version!');
        else if (data.status === 'error') toast.error('Failed to check for updates: ' + data.message);
      });
    }
    return () => { window.electronAPI?.removeUpdateStatusListener?.(); };
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
          whatsapp_mode: data.whatsapp_mode || 'manual',
          api_key: data.api_key || '',
          available_credits: data.available_credits ?? 0,
        }));
      }
    } catch {
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        toast.success('Settings updated successfully');
      } else {
        toast.error('Failed to update settings');
      }
    } catch {
      toast.error('Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
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

  const handleRefreshBalance = async () => {
    if (!settings.api_key) {
      toast.error('Please enter an API key first.');
      return;
    }
    setRefreshingBalance(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/balance`, {
        headers: { 'Authorization': `Bearer ${settings.api_key}` },
      });
      const data = await res.json();
      if (data.success) {
        const newCredits = data.availableCredits;
        setSettings(prev => ({ ...prev, available_credits: newCredits }));
        // Persist to local SQLite
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ ...settings, available_credits: newCredits }),
        });
        toast.success(`Balance synced: ${newCredits} credits`);
      } else {
        toast.error('Failed to sync balance: ' + (data.message || 'Check your API key'));
      }
    } catch {
      toast.error('Could not reach the message backend. Check your internet connection.');
    } finally {
      setRefreshingBalance(false);
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

  const creditColor = settings.available_credits > 100
    ? 'text-green-400'
    : settings.available_credits > 0
    ? 'text-yellow-400'
    : 'text-red-400';

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
          className="shrink-0 px-8 py-3 bg-electric-500 text-white rounded font-medium disabled:opacity-50 flex items-center gap-2 hover:bg-electric-600 transition-colors uppercase tracking-widest text-sm shadow-[0_0_15px_rgba(0,102,255,0.2)]"
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

          {/* Left Column — General Settings */}
          <div className="flex flex-col gap-8 h-full">
            <div className="space-y-6 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg h-full">
              <h3 className="text-[10px] font-bold text-electric-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="w-1 h-3 bg-electric-500 rounded-sm inline-block"></span>
                General System Settings
              </h3>
              <div className="space-y-2">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Name</label>
                <input type="text" name="gym_name" value={settings.gym_name} onChange={handleChange} required
                  className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                  placeholder="Enter Gym Name" />
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Email</label>
                  <input type="email" name="gym_email" value={settings.gym_email || ''} onChange={handleChange}
                    className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                    placeholder="contact@gym.com" />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Phone</label>
                  <input type="text" name="gym_phone" value={settings.gym_phone || ''} onChange={handleChange}
                    className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                    placeholder="+91 98765 43210" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Gym Address</label>
                <textarea name="gym_address" value={settings.gym_address || ''} onChange={handleChange} rows={3}
                  className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-electric-500 transition-colors"
                  placeholder="123 Fitness Street..." />
              </div>

              <div className="pt-4 border-t border-obsidian-700/50 mt-6">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest mb-2">Application Updates</label>
                <button type="button" onClick={handleCheckUpdate} disabled={isCheckingUpdate}
                  className="w-full px-4 py-3 bg-obsidian-800 border border-obsidian-600 text-electric-400 rounded text-xs font-bold uppercase tracking-widest hover:border-electric-500 hover:text-electric-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {isCheckingUpdate ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
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
          </div>

          {/* Right Column — WhatsApp Settings */}
          <div className="flex flex-col gap-6">

            {/* WhatsApp Automation Section */}
            <div className="space-y-5 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
              <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-green-500 rounded-sm inline-block"></span>
                WhatsApp Automation
              </h3>

              {/* Mode Toggle */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Sending Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['manual', 'automated'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setSettings(prev => ({ ...prev, whatsapp_mode: mode }))}
                      className={`py-3 px-4 rounded text-xs font-bold uppercase tracking-widest transition-all border ${
                        settings.whatsapp_mode === mode
                          ? mode === 'manual'
                            ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                            : 'bg-green-500/10 border-green-500/50 text-green-400'
                          : 'bg-obsidian-800 border-obsidian-600 text-industrial-400 hover:border-obsidian-500'
                      }`}
                    >
                      {mode === 'manual' ? '📲 Manual (wa.me)' : '🤖 Automated (API)'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-industrial-500">
                  {settings.whatsapp_mode === 'manual'
                    ? 'Opens WhatsApp Web/App with the message pre-filled. Free, no credits required.'
                    : 'Sends WhatsApp messages automatically via the GymEase API. Requires credits.'}
                </p>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">GymEase API Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      name="api_key"
                      value={settings.api_key || ''}
                      onChange={handleChange}
                      className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 pr-10 text-sm font-mono focus:outline-none focus:border-green-500 transition-colors"
                      placeholder="ge_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-500 hover:text-industrial-300 transition-colors"
                    >
                      {showApiKey ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-industrial-500">
                  Paste the API key provided by your GymEase platform administrator.
                </p>
              </div>

              {/* Balance Display */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Available Credits</label>
                <div className="flex items-center gap-3 bg-obsidian-800 border border-obsidian-600 rounded p-3">
                  <span className={`text-2xl font-bold font-mono ${creditColor}`}>
                    {settings.available_credits.toLocaleString()}
                  </span>
                  <span className="text-industrial-500 text-sm">credits</span>
                  <div className="ml-auto flex items-center gap-2">
                    {settings.available_credits === 0 && (
                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded">
                        Low Balance
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={handleRefreshBalance}
                      disabled={refreshingBalance || !settings.api_key}
                      className="px-3 py-1.5 bg-obsidian-700 border border-obsidian-600 text-industrial-300 rounded text-xs font-bold uppercase tracking-widest hover:border-green-500 hover:text-green-400 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {refreshingBalance ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      )}
                      Sync
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Message Template */}
            <div className="space-y-5 bg-obsidian-900 p-6 border border-obsidian-700/50 rounded-lg">
              <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1 h-3 bg-green-500 rounded-sm inline-block"></span>
                WhatsApp Message Template
              </h3>

              {/* Variables */}
              <div className="bg-obsidian-800 border border-obsidian-600 rounded p-4">
                <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-3">Available Variables</p>
                <div className="flex flex-wrap gap-2">
                  {['{member_name}', '{gym_name}', '{last_payment_date}', '{subscription_end_date}'].map(v => (
                    <span key={v}
                      className="px-2 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-mono rounded cursor-pointer hover:bg-green-500/20 transition-colors"
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
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-industrial-400 uppercase tracking-widest">Message Body</label>
                <textarea
                  id="whatsapp-template-area"
                  name="whatsapp_message_template"
                  value={settings.whatsapp_message_template}
                  onChange={handleChange}
                  rows={12}
                  className="w-full bg-obsidian-800 border text-white border-obsidian-600 rounded p-3 text-sm focus:outline-none focus:border-green-500 transition-colors font-mono resize-y"
                  placeholder="Enter your WhatsApp reminder message..."
                />
                <p className="text-[10px] text-industrial-500">Use *text* for bold in WhatsApp.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => setShowPreview(p => !p)}
                  className="px-4 py-2 bg-obsidian-700 border border-obsidian-600 text-industrial-300 rounded text-xs font-bold uppercase tracking-widest hover:border-green-500 hover:text-green-400 transition-colors">
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button type="button" onClick={() => setSettings(prev => ({ ...prev, whatsapp_message_template: DEFAULT_WHATSAPP_TEMPLATE }))}
                  className="px-4 py-2 bg-obsidian-700 border border-obsidian-600 text-industrial-300 rounded text-xs font-bold uppercase tracking-widest hover:border-yellow-500 hover:text-yellow-400 transition-colors">
                  Reset to Default
                </button>
              </div>

              {showPreview && (
                <div className="bg-[#0a1a10] border border-green-500/20 rounded-lg p-4">
                  <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-3">WhatsApp Preview (sample data)</p>
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

          </div>
        </div>
      </form>
    </motion.div>
  );
}
