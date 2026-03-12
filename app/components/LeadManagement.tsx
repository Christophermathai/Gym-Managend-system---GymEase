'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { AnimatePresence } from 'framer-motion';
import LottieLoader from './LottieLoader';

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

  if (loading) return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
      <AnimatePresence>
        <LottieLoader size={130} key="lead-loader" />
      </AnimatePresence>
    </div>
  );

  return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-obsidian-700 pb-4">
        <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Leads</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Lead
        </button>
      </div>

      {/* Status Filter */}
      <div className="mb-6 max-w-xs">
        <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Status Filter</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full px-3 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
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
      <div className="overflow-x-auto border border-obsidian-600 rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-obsidian-900 border-b border-obsidian-600">
            <tr>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Name</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Phone</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Email</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Source</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Level</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Status</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-700/50">
            {leads.length > 0 ? (
              leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-obsidian-700/30 transition-colors group">
                  <td className="px-4 py-3 text-industrial-50 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 font-mono text-industrial-300">{lead.phone}</td>
                  <td className="px-4 py-3 text-industrial-400">{lead.email || '-'}</td>
                  <td className="px-4 py-3 capitalize text-industrial-300">{lead.source}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 border text-[10px] font-bold uppercase tracking-wider rounded-[2px] ${lead.interest_level === 'hot' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                      lead.interest_level === 'warm' ? 'bg-steelgold-500/10 border-steelgold-500/30 text-steelgold-500' :
                        'bg-electric-500/10 border-electric-500/30 text-electric-500'
                      }`}>
                      {lead.interest_level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(lead.id)}
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
                  [ NO LEADS FOUND IN DATABASE ]
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
            <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">Add Lead</h3>

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
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Phone *</label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Source *</label>
                  <select
                    value={formData.source || ''}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                  >
                    <option value="">Select source</option>
                    <option value="walk_in">Walk-in</option>
                    <option value="referral">Referral</option>
                    <option value="online">Online</option>
                    <option value="phone">Phone</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Interest Level *</label>
                  <select
                    value={formData.interest_level || ''}
                    onChange={(e) => setFormData({ ...formData, interest_level: e.target.value })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                  >
                    <option value="">Select level</option>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
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
                ADD LEAD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
