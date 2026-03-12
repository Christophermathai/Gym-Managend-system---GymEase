'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { MemberDetail } from './MemberDetail';
import { toast } from 'sonner';
import LottieLoader from './LottieLoader';

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  bloodGroup: string;
  is_active: boolean;
  subscriptions?: any[];
  payments?: any[];
}

export function MemberManagement({ initialFilter }: { initialFilter?: 'unpaid' | 'partial' | null } = {}) {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState<Partial<Member>>({});
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Filter & sort states
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>(initialFilter === 'unpaid' ? 'unpaid' : 'all');
  const [durationFilter, setDurationFilter] = useState<'all' | '1' | '3' | '6' | '12'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'personal' | 'normal'>('all');
  const [balanceFilter, setBalanceFilter] = useState<'all' | 'has_balance' | 'no_balance'>(initialFilter === 'partial' ? 'has_balance' : 'all');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'date_newest' | 'date_oldest' | 'status'>('name_asc');

  useEffect(() => {
    if (initialFilter === 'unpaid') {
      setPaymentFilter('unpaid');
      setBalanceFilter('all');
    } else if (initialFilter === 'partial') {
      setPaymentFilter('all');
      setBalanceFilter('has_balance');
    } else if (!initialFilter) {
      setPaymentFilter('all');
      setBalanceFilter('all');
    }
  }, [initialFilter]);

  useEffect(() => {
    fetchMembers();
  }, [token]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const response = await fetch(`/api/members?limit=2000`, {
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setMemberToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    const id = memberToDelete;

    try {
      const response = await fetch(`/api/members/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Member deleted successfully');
        if (selectedMemberId === id) setSelectedMemberId(null);
        if (editingMember?.id === id) {
          setEditingMember(null);
          setShowEditModal(false);
        }
        setShowDeleteConfirm(false);
        setMemberToDelete(null);
        fetchMembers();
      } else {
        toast.error('Failed to delete member');
      }
    } catch (error) {
      toast.error('Error deleting member');
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
        <AnimatePresence>
          <LottieLoader size={130} key="member-loader" />
        </AnimatePresence>
      </div>
    );
  }

  // Check if member has active paid fees (active subscription AND no outstanding partial balance)
  const hasPaidFees = (member: Member) => {
    const hasActiveSub = member.subscriptions?.some((s: any) => s.status === 'active' && s.end_date >= Date.now());
    const hasBalance = member.payments?.some((p: any) => p.status === 'partial' && (p.balance ?? 0) > 0);
    return hasActiveSub && !hasBalance;
  };

  // Check if member has an outstanding balance
  const hasOutstandingBalance = (member: Member) =>
    member.payments?.some((p: any) => (p.balance ?? 0) > 0) || false;

  // Filter members
  const filtered = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone.includes(searchTerm) ||
      (member.email && member.email.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (paymentFilter === 'paid' && !hasPaidFees(member)) return false;
    if (paymentFilter === 'unpaid' && hasPaidFees(member)) return false;

    if (durationFilter !== 'all') {
      const activeSub = member.subscriptions?.find((s: any) => s.status === 'active');
      if (!activeSub || activeSub.duration.toString() !== durationFilter) return false;
    }

    if (typeFilter !== 'all') {
      const activeSub = member.subscriptions?.find((s: any) => s.status === 'active');
      const isPersonal = activeSub?.is_personal_training || false;
      if (typeFilter === 'personal' && !isPersonal) return false;
      if (typeFilter === 'normal' && isPersonal) return false;
    }

    if (balanceFilter === 'has_balance' && !hasOutstandingBalance(member)) return false;
    if (balanceFilter === 'no_balance' && hasOutstandingBalance(member)) return false;

    return true;
  });

  // Sort members
  const filteredMembers = [...filtered].sort((a, b) => {
    if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
    if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
    if (sortBy === 'status') return (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0);
    // date_newest / date_oldest — members don't have admission_date in state, fall back to array order
    return 0;
  });

  return (
    <>
      <motion.div
        className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6 border-b border-obsidian-700 pb-4">
          <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Members Directory</h2>
          <button
            onClick={() => fetchMembers()}
            className="px-4 py-2 bg-obsidian-700 text-industrial-50 border border-obsidian-600 rounded hover:border-electric-500 hover:text-electric-500 transition-colors flex items-center gap-2 text-sm font-medium"
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
              placeholder="Search members by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:outline-none focus:border-electric-500 focus:ring-1 focus:ring-electric-500 placeholder:text-obsidian-600"
            />
          </div>

          {/* Filter & Sort Controls */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Payment Status Filter */}
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Payment Status</label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50/90 text-sm focus:border-electric-500 focus:outline-none"
              >
                <option value="all">All Members</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>

            {/* Balance Filter */}
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Balance</label>
              <select
                value={balanceFilter}
                onChange={(e) => setBalanceFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50/90 text-sm focus:border-electric-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="has_balance">Outstanding Balance</option>
                <option value="no_balance">No Balance</option>
              </select>
            </div>

            {/* Duration Filter */}
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Duration</label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50/90 text-sm focus:border-electric-500 focus:outline-none"
              >
                <option value="all">All</option>
                <option value="1">1 Month</option>
                <option value="3">3 Months</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50/90 text-sm focus:border-electric-500 focus:outline-none"
              >
                <option value="date_newest">Default</option>
                <option value="name_asc">Name A → Z</option>
                <option value="name_desc">Name Z → A</option>
                <option value="status">Status (Active first)</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPaymentFilter('all');
                  setDurationFilter('all');
                  setTypeFilter('all');
                  setBalanceFilter('all');
                  setSortBy('date_newest');
                  setSearchTerm('');
                }}
                className="w-full px-3 py-2 text-sm bg-obsidian-700 text-industrial-300 border border-obsidian-600 hover:border-obsidian-500 rounded transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="text-xs font-mono text-industrial-400 mt-2">
            DATABASE RESPONSE: {filteredMembers.length} OF {members.length} MEMBERS
          </div>
        </div>

        {/* Members Table */}
        <div className="overflow-x-auto border border-obsidian-600 rounded">
          <table className="w-full text-sm text-left">
            <thead className="bg-obsidian-900 border-b border-obsidian-600">
              <tr>
                <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Name</th>
                <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Contact Data</th>
                <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Membership State</th>
                <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-obsidian-700/50">
              {filteredMembers && filteredMembers.length > 0 ? (
                filteredMembers.map((member, index) => (
                  <motion.tr
                    key={member.id}
                    className="hover:bg-obsidian-700/30 transition-colors group"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <td className="px-4 py-3 align-middle">
                      <button
                        onClick={() => setSelectedMemberId(member.id)}
                        className="text-industrial-50 font-semibold uppercase hover:text-electric-500 transition-colors text-left"
                      >
                        {member.name}
                      </button>
                    </td>
                    <td className="px-4 py-3 align-middle font-mono text-xs text-industrial-300">
                      <div>{member.phone}</div>
                      {member.email && <div className="text-industrial-400 text-[10px]">{member.email}</div>}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${member.is_active
                          ? 'bg-electric-500/10 border-electric-500/30 text-electric-500'
                          : 'bg-obsidian-600 border-obsidian-500 text-industrial-400'
                          }`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {!hasPaidFees(member) && (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border bg-red-500/10 border-red-500/30 text-red-500">
                            Unpaid
                          </span>
                        )}
                        {hasOutstandingBalance(member) && (
                          <span className="px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border bg-steelgold-500/10 border-steelgold-500/30 text-steelgold-500">
                            Bal Due
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!hasPaidFees(member) && (
                          <button
                            onClick={() => sendWhatsAppReminder(member)}
                            className="px-2 py-1.5 bg-green-500/10 text-green-500 border border-green-500/30 rounded inline-flex items-center gap-1 hover:bg-green-500/20 transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                          </button>
                        )}
                        <button
                          onClick={() => handleEditClick(member)}
                          className="px-3 py-1.5 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs hover:border-industrial-400 transition-colors"
                        >
                          EDIT
                        </button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-xs hover:bg-red-500/20 transition-colors"
                        >
                          DEL
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-industrial-400 font-mono text-xs">
                    [ NO MEMBERS FOUND IN DATABASE ]
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && editingMember && (
        <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">Edit Member</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Phone</label>
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
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup || ''}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active || false}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 bg-obsidian-900 border-obsidian-600 text-electric-500 focus:ring-electric-500 rounded-sm"
                />
                <span className="text-sm font-bold text-industrial-300 uppercase tracking-widest">Active Member</span>
              </label>
            </div>

            <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded hover:text-industrial-50 text-sm font-medium transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 text-sm font-medium transition-colors"
              >
                SAVE CHANGES
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
          <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-2xl p-8 max-w-sm w-full text-center">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-industrial-50 uppercase tracking-wider mb-2">Delete Member?</h3>
            <p className="text-industrial-400 text-sm mb-8 leading-relaxed">
              This action cannot be undone. All subscription and payment history for this member will be permanently removed.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMemberToDelete(null);
                }}
                className="px-4 py-2.5 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-widest hover:text-industrial-50 transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 bg-red-600 text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition-shadow shadow-lg shadow-red-600/20"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
