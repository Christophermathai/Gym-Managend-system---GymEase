'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface LowBalanceModalProps {
  gymId: string;
  apiKey: string;
  onClose: () => void;
  onBalanceSynced: (newCredits: number) => void;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_MESSAGE_BACKEND_URL || 'https://gymease-backend.vercel.app';
const RECHARGE_HMAC_SECRET = process.env.NEXT_PUBLIC_RECHARGE_HMAC_SECRET || '';

export function LowBalanceModal({ gymId, apiKey, onClose, onBalanceSynced }: LowBalanceModalProps) {
  const { token } = useAuth();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [rechargeUrl, setRechargeUrl] = useState('');

  useEffect(() => {
    generateQR();
  }, []);

  const generateQR = async () => {
    try {
      // Get a signed recharge token from the backend
      const res = await fetch(`${BACKEND_URL}/api/recharge/get-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error('Failed to get recharge token');

      const url = `${BACKEND_URL}/recharge?token=${data.token}`;
      setRechargeUrl(url);

      // Dynamically import QRCode (client-side only)
      const QRCode = (await import('qrcode')).default;
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#22d3ee', light: '#0a0a0f' },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error('QR generation error:', err);
      // Fallback: generate QR without token (uses gymId directly)
      try {
        const fallbackUrl = `${BACKEND_URL}/recharge?gymId=${gymId}`;
        setRechargeUrl(fallbackUrl);
        const QRCode = (await import('qrcode')).default;
        const dataUrl = await QRCode.toDataURL(fallbackUrl, {
          width: 200,
          margin: 2,
          color: { dark: '#22d3ee', light: '#0a0a0f' },
        });
        setQrDataUrl(dataUrl);
      } catch {
        setQrDataUrl(null);
      }
    }
  };

  const handleSyncBalance = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/messages/balance`, {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      const data = await res.json();
      if (data.success && data.availableCredits > 0) {
        // Persist to local SQLite
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ available_credits: data.availableCredits }),
        });
        toast.success(`${data.availableCredits} credits loaded! You can now send messages.`);
        onBalanceSynced(data.availableCredits);
        onClose();
      } else if (data.availableCredits === 0) {
        toast.error('No credits found yet. Please complete payment and try again.');
      } else {
        toast.error('Balance check failed. Please try again.');
      }
    } catch {
      toast.error('Could not reach the server. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        {/* Header */}
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-industrial-50 uppercase tracking-wide mb-2">
          No WhatsApp Credits
        </h2>
        <p className="text-industrial-400 text-sm mb-6 leading-relaxed">
          Your automated WhatsApp credits have run out. Scan the QR code below on your phone to recharge instantly.
        </p>

        {/* QR Code */}
        <div className="flex justify-center mb-5">
          {qrDataUrl ? (
            <div className="p-3 bg-[#0a0a0f] rounded-xl inline-block border border-obsidian-600">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="Recharge QR Code" className="w-44 h-44" />
            </div>
          ) : (
            <div className="w-44 h-44 bg-obsidian-900 border border-obsidian-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-industrial-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
            </div>
          )}
        </div>

        <p className="text-industrial-500 text-xs mb-1">Or open this link on your phone:</p>
        <a href={rechargeUrl} target="_blank" rel="noopener noreferrer"
          className="text-electric-400 text-xs font-mono underline break-all hover:text-electric-300 transition-colors">
          {rechargeUrl || 'Loading…'}
        </a>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button onClick={onClose}
            className="px-4 py-2.5 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-widest hover:text-industrial-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSyncBalance} disabled={syncing}
            className="px-4 py-2.5 bg-electric-500 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-electric-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {syncing ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Syncing…
              </>
            ) : '✓ I Recharged — Sync'}
          </button>
        </div>
      </div>
    </div>
  );
}
