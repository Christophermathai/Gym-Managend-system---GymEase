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
    address: '',
    bloodGroup: '',
    medicalNotes: '',
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
          address: '',
          bloodGroup: '',
          medicalNotes: '',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[75vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Add New Member</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="Member name"
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
            <label className="block text-sm font-medium">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Blood Group</label>
            <input
              type="text"
              value={formData.bloodGroup}
              onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              placeholder="e.g., O+"
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
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </div>
  );
}
