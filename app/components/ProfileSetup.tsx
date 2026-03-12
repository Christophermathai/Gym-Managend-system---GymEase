'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export function ProfileSetup() {
  const { createProfile } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // All self-registered users are owners. Trainers are added via Staff Management.
      await createProfile(name, 'owner', phone);
      toast.success('Profile created successfully!');
    } catch (error) {
      toast.error('Failed to create profile');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px] p-8">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-2xl font-bold text-industrial-50 mb-2 uppercase tracking-wide">Complete Your Profile</h1>
          <p className="text-industrial-400 font-mono text-xs uppercase tracking-widest">[ SET UP YOUR GYM OWNER PROFILE ]</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 border-l-2 border-electric-500 pl-2">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="FULL NAME"
              required
            />
          </div>

          <div className="mb-8">
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 pl-2">Phone (Optional)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono transition-colors"
              placeholder="PHONE NUMBER"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !name}
            className="w-full px-6 py-3 bg-electric-500 text-white rounded text-sm font-bold uppercase tracking-wider hover:bg-electric-600 disabled:opacity-50 border border-transparent shadow-[0_0_15px_rgba(0,102,255,0.3)] transition-colors"
          >
            {submitting ? 'CREATING PROFILE...' : 'CREATE PROFILE'}
          </button>
        </form>
      </div>
    </div>
  );
}
