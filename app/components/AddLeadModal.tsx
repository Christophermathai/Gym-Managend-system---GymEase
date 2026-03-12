'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLeadModal({ isOpen, onClose, onSuccess }: AddLeadModalProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    source: 'walk_in',
    interest_level: 'warm',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.source) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          source: formData.source,
          interestLevel: formData.interest_level,
          notes: formData.notes,
        }),
      });

      if (response.ok) {
        toast.success('Lead added successfully');
        setFormData({
          name: '',
          phone: '',
          email: '',
          source: 'walk_in',
          interest_level: 'warm',
          notes: '',
        });
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to add lead');
      }
    } catch (error) {
      toast.error('Error adding lead');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-800 rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-obsidian-600 shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2 uppercase tracking-wide">Add New Lead</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="LEAD NAME"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono transition-colors"
              placeholder="PHONE NUMBER"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono transition-colors"
              placeholder="EMAIL ADDRESS"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors uppercase tracking-wide text-xs"
            >
              <option value="">SELECT A SOURCE</option>
              <option value="walk_in">WALK IN</option>
              <option value="referral">REFERRAL</option>
              <option value="online">ONLINE</option>
              <option value="phone">PHONE</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Interest Level</label>
            <select
              value={formData.interest_level}
              onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors uppercase tracking-wide text-xs"
            >
              <option value="cold">COLD</option>
              <option value="warm">WARM</option>
              <option value="hot">HOT</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors resize-none placeholder:text-obsidian-500 uppercase tracking-wide text-xs"
              placeholder="ADDITIONAL NOTES"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-wider hover:text-industrial-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-electric-500 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-electric-600 disabled:opacity-50 border border-transparent shadow-[0_0_15px_rgba(0,102,255,0.3)] transition-colors"
            disabled={loading}
          >
            {loading ? 'ADDING...' : 'ADD LEAD'}
          </button>
        </div>
      </div>
    </div>
  );
}
