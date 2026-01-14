'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/app/lib/utils';

interface Staff {
  id: string;
  name: string;
  role: string;
  email?: string;
  phone: string;
  salary: number;
  joining_date: string;
  is_active: boolean;
  password?: string; // Only used when creating trainer accounts
}

export function StaffManagement() {
  const { token } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Staff>>({});

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/staff', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStaff(Array.isArray(data) ? data : (data.staff || []));
      } else {
        setStaff([]);
      }
    } catch (error) {
      toast.error('Failed to fetch staff');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    // Validate required fields
    if (!formData.name || !formData.role || !formData.phone || !formData.salary || !formData.joining_date) {
      toast.error('Please fill all required fields');
      return;
    }

    // Additional validation for trainers
    if (formData.role === 'trainer') {
      if (!formData.email || !formData.password) {
        toast.error('Email and password are required for trainers');
        return;
      }
    }

    try {
      const response = await fetch('/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Staff added successfully');
        setShowAddModal(false);
        setFormData({});
        fetchStaff();
      } else {
        toast.error('Failed to add staff');
      }
    } catch (error) {
      toast.error('Error adding staff');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure?')) return;

    try {
      const response = await fetch(`/api/staff/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Staff removed');
        fetchStaff();
      }
    } catch (error) {
      toast.error('Error removing staff');
    }
  };

  if (loading) return <div className="p-4">Loading staff...</div>;

  const totalSalaries = staff.reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Staff</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + Add Staff
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <p className="text-lg font-semibold">Total Monthly Salaries: {formatCurrency(totalSalaries)}</p>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-right">Salary</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{s.name}</td>
                <td className="p-2 capitalize">{s.role}</td>
                <td className="p-2">{s.phone}</td>
                <td className="p-2">{s.email || '-'}</td>
                <td className="p-2 text-right font-semibold">{formatCurrency(s.salary)}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Staff Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Role *</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select role</option>
                  <option value="trainer">Trainer</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Email {formData.role === 'trainer' ? '*' : ''}</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  required={formData.role === 'trainer'}
                />
                {formData.role === 'trainer' && (
                  <p className="text-xs text-gray-500 mt-1">Required for trainer login</p>
                )}
              </div>

              {formData.role === 'trainer' && (
                <div>
                  <label className="block text-sm font-medium">Password *</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded"
                    placeholder="Login password for trainer"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Trainer will use this to log in</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium">Monthly Salary *</label>
                <input
                  type="number"
                  value={formData.salary || ''}
                  onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Joining Date *</label>
                <input
                  type="date"
                  value={formData.joining_date || ''}
                  onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Staff
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
