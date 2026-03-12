'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/app/lib/utils';
import LottieLoader from './LottieLoader';

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

  if (loading) return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
      <LottieLoader size={130} />
    </div>
  );

  const totalSalaries = staff.reduce((sum, s) => sum + s.salary, 0);

  return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-obsidian-700 pb-4">
        <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Staff</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Staff
        </button>
      </div>

      {/* Summary */}
      <div className="mb-6 p-4 bg-obsidian-900/50 border border-obsidian-600 rounded flex justify-between items-center max-w-sm">
        <span className="text-sm font-bold text-industrial-400 uppercase tracking-widest">Total Monthly Salaries</span>
        <span className="text-xl font-bold text-electric-500 font-mono">{formatCurrency(totalSalaries)}</span>
      </div>

      {/* Staff Table */}
      <div className="overflow-x-auto border border-obsidian-600 rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-obsidian-900 border-b border-obsidian-600">
            <tr>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Name</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Role</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Phone</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Email</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Salary</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-700/50">
            {staff.length > 0 ? (
              staff.map((s) => (
                <tr key={s.id} className="hover:bg-obsidian-700/30 transition-colors group">
                  <td className="px-4 py-3 text-industrial-50 font-medium">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                      {s.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-industrial-300">{s.phone}</td>
                  <td className="px-4 py-3 text-industrial-400">{s.email || '-'}</td>
                  <td className="px-4 py-3 font-mono font-bold text-industrial-50 text-right">{formatCurrency(s.salary)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-[2px] ${s.is_active ? 'bg-green-500/10 border-green-500/30 text-green-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                      {s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-xs font-bold tracking-wider hover:bg-red-500/20 transition-colors uppercase"
                      >
                        DEL
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-industrial-400 font-mono text-xs">
                  [ NO STAFF FOUND IN DATABASE ]
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">Add Staff Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Name *</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Role *</label>
                <select
                  value={formData.role || ''}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                >
                  <option value="">Select role</option>
                  <option value="trainer">Trainer</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="cleaning">Cleaning</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Email {formData.role === 'trainer' ? '*' : ''}</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                  required={formData.role === 'trainer'}
                />
                {formData.role === 'trainer' && (
                  <p className="text-[10px] uppercase tracking-wider text-obsidian-400 mt-1">Required for trainer login</p>
                )}
              </div>

              {formData.role === 'trainer' && (
                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Password *</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                    placeholder="Login password for trainer"
                    required
                  />
                  <p className="text-[10px] uppercase tracking-wider text-obsidian-400 mt-1">Trainer will use this to log in</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Monthly Salary *</label>
                  <input
                    type="number"
                    value={formData.salary || ''}
                    onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Joining Date *</label>
                  <input
                    type="date"
                    value={formData.joining_date || ''}
                    onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono [color-scheme:dark]"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded hover:text-industrial-50 text-sm font-medium transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 text-sm font-medium transition-colors"
              >
                ADD STAFF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
