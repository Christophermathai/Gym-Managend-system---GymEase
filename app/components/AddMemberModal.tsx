'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddMemberModal({ isOpen, onClose, onSuccess }: AddMemberModalProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    gender: 'male',
    bloodGroup: '',
    admissionDate: Date.now(),
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Submitting member form data:', formData);
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Member added successfully');
        setFormData({
          name: '',
          phone: '',
          email: '',
          gender: 'male',
          bloodGroup: '',
          admissionDate: Date.now(),
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        toast.error(errorData.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Error adding member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 w-full max-w-md max-h-[75vh] overflow-y-auto shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2 uppercase tracking-wide">Add New Member</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors"
              placeholder="MEMBER NAME"
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
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none transition-colors uppercase text-xs tracking-wide"
            >
              <option value="male">MALE</option>
              <option value="female">FEMALE</option>
              <option value="other">OTHER</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Blood Group</label>
            <input
              type="text"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono transition-colors uppercase"
              placeholder="E.G., O+"
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
            className="px-6 py-2 bg-electric-500 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-electric-600 disabled:opacity-50 shadow-[0_0_15px_rgba(0,102,255,0.3)] transition-colors border border-transparent"
            disabled={loading}
          >
            {loading ? 'ADDING...' : 'ADD MEMBER'}
          </button>
        </div>
      </div>
    </div>
  );
}
