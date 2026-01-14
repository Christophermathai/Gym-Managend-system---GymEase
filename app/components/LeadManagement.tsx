'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: string;
  interest_level: string;
  status: string;
  created_at: string;
}

export function LeadManagement() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<Partial<Lead>>({});

  useEffect(() => {
    fetchLeads();
  }, [status]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const url = status ? `/api/leads?status=${status}` : '/api/leads';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(Array.isArray(data) ? data : (data.leads || []));
      } else {
        setLeads([]);
      }
    } catch (error) {
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.name || !formData.phone || !formData.source || !formData.interest_level) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Lead added successfully');
        setShowAddModal(false);
        setFormData({});
        fetchLeads();
      } else {
        toast.error('Failed to add lead');
      }
    } catch (error) {
      toast.error('Error adding lead');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return;

    try {
      const response = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Lead deleted');
        fetchLeads();
      }
    } catch (error) {
      toast.error('Error deleting lead');
    }
  };

  if (loading) return <div className="p-4">Loading leads...</div>;

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Leads</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + Add Lead
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border rounded"
        >
          <option value="">All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="interested">Interested</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Leads Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Source</th>
              <th className="p-2 text-left">Level</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{lead.name}</td>
                <td className="p-2">{lead.phone}</td>
                <td className="p-2">{lead.email || '-'}</td>
                <td className="p-2 capitalize">{lead.source}</td>
                <td className="p-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    lead.interest_level === 'hot' ? 'bg-red-100 text-red-800' :
                    lead.interest_level === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {lead.interest_level.toUpperCase()}
                  </span>
                </td>
                <td className="p-2 capitalize">{lead.status}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
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
            <h3 className="text-xl font-bold mb-4">Add Lead</h3>

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
                <label className="block text-sm font-medium">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Source *</label>
                <select
                  value={formData.source || ''}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select source</option>
                  <option value="walk_in">Walk-in</option>
                  <option value="referral">Referral</option>
                  <option value="online">Online</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Interest Level *</label>
                <select
                  value={formData.interest_level || ''}
                  onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select level</option>
                  <option value="hot">Hot</option>
                  <option value="warm">Warm</option>
                  <option value="cold">Cold</option>
                </select>
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
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
