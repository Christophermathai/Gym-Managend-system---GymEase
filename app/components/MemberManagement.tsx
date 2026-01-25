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

  const sendWhatsAppReminder = async (member: Member) => {
    try {
      // Fetch gym settings
      const settingsRes = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const settings = await settingsRes.json();
      const gymName = settings.gym_name || 'Gym Ease';

      // Format phone number (remove spaces, dashes, etc.)
      const phoneNumber = member.phone.replace(/\D/g, '');

      // Get last payment and subscription details
      const lastPayment = member.payments && member.payments.length > 0
        ? member.payments[member.payments.length - 1]
        : null;
      const activeSubscription = member.subscriptions && member.subscriptions.length > 0
        ? member.subscriptions.find((sub: any) => sub.status === 'active')
        : null;

      // Format dates
      const lastPaymentDate = lastPayment
        ? new Date(lastPayment.payment_date).toLocaleDateString('en-IN')
        : 'N/A';
      const subscriptionEndDate = activeSubscription
        ? new Date(activeSubscription.end_date).toLocaleDateString('en-IN')
        : 'N/A';

      // Create enhanced reminder message
      const message = `Hello ${member.name},

This is a friendly reminder from *${gymName}* regarding your membership fees.

*Payment Details:*
- Last Payment: ${lastPaymentDate}
- Membership Expires: ${subscriptionEndDate}
- Status: Payment Pending

Your payment is currently overdue. Please make the payment at your earliest convenience to continue enjoying our services without interruption.

Please visit the gym or contact us to complete your payment.

Thank you for your cooperation!

Best regards,
${gymName} Team`;

      // Encode message for URL
      const encodedMessage = encodeURIComponent(message);

      // Open WhatsApp with pre-filled message
      window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank');
    } catch (error) {
      console.error('Error sending WhatsApp reminder:', error);
      toast.error('Failed to open WhatsApp');
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
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        {!hasPaidFees(member) && (
                          <button
                            onClick={() => sendWhatsAppReminder(member)}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 inline-flex items-center gap-1"
                            title="Send WhatsApp Reminder"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp
                          </button>
                        )}
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
                      </div>
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
