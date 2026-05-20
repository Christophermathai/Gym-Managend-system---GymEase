'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/app/lib/utils';
import LottieLoader from './LottieLoader';
import { ConfirmDialog } from './ConfirmDialog';

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
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── Trainer credential modal state ─────────────────────────────────────────
  const [resetTarget, setResetTarget] = useState<Staff | null>(null);
  const [resetTab, setResetTab] = useState<'reset' | 'revoke'>('reset');
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const closeResetModal = () => {
    setResetTarget(null);
    setAdminPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setResetTab('reset');
  };

  const handleCredentialAction = async () => {
    if (!resetTarget) return;
    if (!adminPassword) { toast.error('Enter your admin password'); return; }
    if (resetTab === 'reset') {
      if (!newPassword) { toast.error('Enter a new password'); return; }
      if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
      if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    }
    setResetLoading(true);
    try {
      const res = await fetch(`/api/staff/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          adminPassword,
          action: resetTab,
          newPassword: resetTab === 'reset' ? newPassword : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        closeResetModal();
        fetchStaff();
      } else {
        toast.error(data.error || 'Operation failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setResetLoading(false);
    }
  };

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

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.role || !formData.phone || formData.salary === undefined || !formData.joining_date) {
      toast.error('Please fill all required fields');
      return;
    }

    // Additional validation for trainers
    if (formData.role === 'trainer') {
      if (!formData.email) {
        toast.error('Email is required for trainers');
        return;
      }
      if (!editingId && !formData.password) {
        toast.error('Password is required for new trainers');
        return;
      }
    }

    try {
      const url = editingId ? `/api/staff/${editingId}` : '/api/staff';
      const method = editingId ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        isActive: formData.is_active,
        joiningDate: formData.joining_date
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(`Staff ${editingId ? 'updated' : 'added'} successfully`);
        setShowAddModal(false);
        setFormData({});
        setEditingId(null);
        fetchStaff();
      } else {
        toast.error(`Failed to ${editingId ? 'update' : 'add'} staff`);
      }
    } catch (error) {
      toast.error(`Error ${editingId ? 'updating' : 'adding'} staff`);
    }
  };

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/staff/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Staff removed');
        fetchStaff();
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      toast.error('Error removing staff');
    } finally {
      setDeleteId(null);
    }
  };

  if (loading) return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
      <LottieLoader size={130} />
    </div>
  );

  const totalSalaries = staff.reduce((sum, s) => sum + s.salary, 0);
  const staffToDelete = staff.find(s => s.id === deleteId);
  const isCurrentlyInactive = staffToDelete ? !staffToDelete.is_active : false;

  return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-obsidian-700 pb-4">
        <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Staff</h2>
        <button
          onClick={() => {
            setFormData({});
            setEditingId(null);
            setShowAddModal(true);
          }}
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
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                      {s.role === 'trainer' && s.email && (
                        <button
                          onClick={() => { setResetTarget(s); setResetTab('reset'); }}
                          title="Manage trainer login"
                          className="px-3 py-1.5 bg-steelgold-500/10 text-steelgold-400 border border-steelgold-500/30 rounded text-xs font-bold tracking-wider hover:bg-steelgold-500/20 transition-colors uppercase flex items-center gap-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                          PWD
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setFormData(s);
                          setEditingId(s.id);
                          setShowAddModal(true);
                        }}
                        className="px-3 py-1.5 bg-steelgold-500/10 text-steelgold-500 border border-steelgold-500/30 rounded text-xs font-bold tracking-wider hover:bg-steelgold-500/20 transition-colors uppercase"
                      >
                        EDIT
                      </button>
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
            <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">
              {editingId ? 'Edit Staff Member' : 'Add Staff Member'}
            </h3>

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

              {formData.role === 'trainer' && !editingId && (
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

              {editingId && (
                <div className="pt-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData.is_active ?? true}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-obsidian-900 border border-obsidian-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-obsidian-400 after:border-obsidian-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-electric-500 peer-checked:border-electric-500 peer-checked:after:bg-white"></div>
                    </div>
                    <span className="text-sm font-bold text-industrial-300 uppercase tracking-widest">
                      {formData.is_active !== false ? 'Active Account' : 'Inactive Account'}
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({});
                  setEditingId(null);
                }}
                className="px-4 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded hover:text-industrial-50 text-sm font-medium transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 text-sm font-medium transition-colors"
              >
                {editingId ? 'SAVE CHANGES' : 'ADD STAFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Trainer Credential Modal ──────────────────────────────────────── */}
      {resetTarget && (
        <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-2xl p-6 w-full max-w-md">

            {/* Header */}
            <div className="flex items-start justify-between mb-6 border-b border-obsidian-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-wide">Trainer Login Access</h3>
                <p className="text-xs text-industrial-400 mt-1 font-mono">{resetTarget.name} · {resetTarget.email}</p>
              </div>
              <button onClick={closeResetModal} className="text-industrial-500 hover:text-industrial-200 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-6 bg-obsidian-900 p-1 rounded">
              <button
                onClick={() => setResetTab('reset')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
                  resetTab === 'reset'
                    ? 'bg-electric-500 text-white shadow'
                    : 'text-industrial-400 hover:text-industrial-200'
                }`}
              >
                🔑 Reset Password
              </button>
              <button
                onClick={() => setResetTab('revoke')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded transition-colors ${
                  resetTab === 'revoke'
                    ? 'bg-red-600 text-white shadow'
                    : 'text-industrial-400 hover:text-industrial-200'
                }`}
              >
                🚫 Revoke Access
              </button>
            </div>

            <div className="space-y-4">
              {/* Honeypot — stops browser autofill */}
              <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} readOnly tabIndex={-1} />
              <input type="password" name="password" autoComplete="current-password" style={{ display: 'none' }} readOnly tabIndex={-1} />

              {/* Admin password — always required */}
              <div>
                <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">
                  Your Admin Password *
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoComplete="new-password"
                  name="admin-confirm-pwd"
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                  placeholder="Enter your admin password to confirm"
                />
              </div>

              {/* Reset fields */}
              {resetTab === 'reset' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-green-500 pl-2">
                      New Password for Trainer *
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                      name="trainer-new-pwd"
                      className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-green-500 focus:outline-none font-mono"
                      placeholder="Min. 6 characters"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-green-500 pl-2">
                      Confirm New Password *
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      name="trainer-confirm-pwd"
                      className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-green-500 focus:outline-none font-mono"
                      placeholder="Repeat new password"
                    />
                  </div>
                  <p className="text-[10px] text-industrial-500 font-mono">
                    The trainer will be able to log in immediately with their new password.
                  </p>
                </>
              )}

              {/* Revoke warning */}
              {resetTab === 'revoke' && (
                <div className="bg-red-500/10 border border-red-500/30 rounded p-4">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">⚠ Irreversible Action</p>
                  <p className="text-xs text-red-300 leading-relaxed">
                    This will <strong>permanently delete</strong> {resetTarget.name}&apos;s login account and mark them as inactive.
                    They will no longer be able to access the system. To restore access, you must re-add them as a trainer with a new password.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-obsidian-700 flex justify-end gap-3">
              <button
                onClick={closeResetModal}
                disabled={resetLoading}
                className="px-4 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded hover:text-industrial-50 text-sm font-medium transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleCredentialAction}
                disabled={resetLoading}
                className={`px-5 py-2 rounded text-sm font-bold uppercase tracking-widest transition-colors disabled:opacity-50 flex items-center gap-2 ${
                  resetTab === 'revoke'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-electric-500 hover:bg-electric-600 text-white'
                }`}
              >
                {resetLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Processing...
                  </>
                ) : resetTab === 'revoke' ? 'Revoke Access' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        title={isCurrentlyInactive ? "Permanently Delete Staff?" : "Deactivate Staff?"}
        message={
          isCurrentlyInactive
            ? "This staff member is currently inactive. Deleting them will permanently remove their record and all their associated login credentials from the system. This action cannot be undone."
            : "This active staff member will be deactivated and marked as inactive. They will remain in the system records."
        }
        confirmLabel={isCurrentlyInactive ? "PERMANENTLY DELETE" : "DEACTIVATE"}
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
