'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { MemberDetail } from './MemberDetail';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  address: string;
  bloodGroup: string;
  medicalNotes: string;
  is_active: boolean;
  subscriptions?: any[];
  payments?: any[];
}

export function MemberManagement({ initialFilter }: { initialFilter?: 'unpaid' | null } = {}) {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter states
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>(initialFilter === 'unpaid' ? 'unpaid' : 'all');
  const [ageFilter, setAgeFilter] = useState<'all' | '18-25' | '26-35' | '36-45' | '46+'>('all');

  useEffect(() => {
    if (initialFilter) {
      setPaymentFilter(initialFilter);
    }
  }, [initialFilter]);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, [searchTerm]); // Refetch when search term changes

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members?search=${searchTerm}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      } else {
        setMembers([]);
      }
    } catch (error) {
      toast.error('Failed to fetch members');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (member: Member) => {
    setEditingMember(member);
    setFormData(member);
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/members/${editingMember?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: editingMember?.id,
          ...formData,
        }),
      });

      if (response.ok) {
        toast.success('Member updated successfully');
        setShowEditModal(false);
        fetchMembers();
      } else {
        toast.error('Failed to update member');
      }
    } catch (error) {
      toast.error('Error updating member');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this member?')) return;

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Member deleted successfully');
        fetchMembers();
      } else {
        toast.error('Failed to delete member');
      }
    } catch (error) {
      toast.error('Error deleting member');
    }
  };

  if (loading) return <div className="p-4">Loading members...</div>;

  // Calculate age from admission date (approximate)
  const calculateAge = (admissionDate: number) => {
    const years = Math.floor((Date.now() - admissionDate) / (365.25 * 24 * 60 * 60 * 1000));
    return Math.max(18, Math.min(65, 25 + years)); // Approximate age based on admission
  };

  // Check if member has paid fees
  const hasPaidFees = (member: Member) => {
    // Check if member has any payments recorded
    return member.payments && member.payments.length > 0;
  };

  // Filter members
  const filteredMembers = members.filter(member => {
    // Search filter
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    // Payment filter
    if (paymentFilter === 'paid' && !hasPaidFees(member)) return false;
    if (paymentFilter === 'unpaid' && hasPaidFees(member)) return false;

    // Age filter (approximate)
    if (ageFilter !== 'all') {
      const age = calculateAge(member.subscriptions?.[0]?.created_at || Date.now());
      if (ageFilter === '18-25' && (age < 18 || age > 25)) return false;
      if (ageFilter === '26-35' && (age < 26 || age > 35)) return false;
      if (ageFilter === '36-45' && (age < 36 || age > 45)) return false;
      if (ageFilter === '46+' && age < 46) return false;
    }

    return true;
  });

  return (
    <>
      <motion.div
        className="p-6 bg-white rounded-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Members</h2>
          <button
            onClick={() => fetchMembers()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4">
          {/* Search */}
          <div>
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex gap-4 flex-wrap">
            {/* Payment Status Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Members</option>
                <option value="paid">Paid Fees</option>
                <option value="unpaid">Unpaid Fees</option>
              </select>
            </div>

            {/* Age Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Ages</option>
                <option value="18-25">18-25 years</option>
                <option value="26-35">26-35 years</option>
                <option value="36-45">36-45 years</option>
                <option value="46+">46+ years</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPaymentFilter('all');
                  setAgeFilter('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="text-sm text-gray-600">
            Showing {filteredMembers.length} of {members.length} members
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Phone</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    className="border-b hover:bg-gray-50"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="p-2">
                      <button
                        onClick={() => setSelectedMemberId(member.id)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {member.name}
                      </button>
                    </td>
                    <td className="p-2">{member.phone}</td>
                    <td className="p-2">{member.email}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {!hasPaidFees(member) && (
                        <span className="ml-2 px-2 py-1 rounded text-xs font-semibold bg-yellow-100 text-yellow-800">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center space-x-2">
                      <button
                        onClick={() => handleEditClick(member)}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-500">
                    No members found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Edit Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Phone</label>
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
                <label className="block text-sm font-medium">Address</label>
                <input
                  type="text"
                  value={formData.address || ''}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Blood Group</label>
                <input
                  type="text"
                  value={formData.bloodGroup || ''}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  Active
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Detail Modal */}
      {selectedMemberId && (
        <MemberDetail
          memberId={selectedMemberId}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </>
  );
}
