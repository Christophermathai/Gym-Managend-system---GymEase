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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-120 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add New Lead</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Lead name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Phone *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Source *</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="">Select a source</option>
              <option value="walk_in">Walk In</option>
              <option value="referral">Referral</option>
              <option value="online">Online</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Interest Level</label>
            <select
              value={formData.interest_level}
              onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="cold">Cold</option>
              <option value="warm">Warm</option>
              <option value="hot">Hot</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}
