'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatDate, formatCurrency } from '@/app/lib/utils';

interface MemberDetailProps {
  memberId: string;
  onClose: () => void;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  email?: string;
  gender?: string;
  address?: string;
  blood_group?: string;
  medical_notes?: string;
  is_active: boolean;
  created_at: number;
}

interface Subscription {
  id: string;
  member_id: string;
  fee_plan_id: string;
  start_date: number;
  end_date: number;
  status: string;
  plan_name: string;
  duration: number;
  monthly_fee: number;
}

interface Payment {
  id: string;
  member_id: string;
  subscription_id: string;
  amount: number;
  payment_type: string;
  payment_mode: string;
  transaction_id: string;
  payment_date: number;
  notes: string;
}

export function MemberDetail({ memberId, onClose }: MemberDetailProps) {
  const { token } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberDetails();
  }, [memberId]);

  const fetchMemberDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/members/${memberId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setMember(data.member);
        setSubscription(data.subscription);
      } else {
        toast.error('Failed to load member details');
      }

      // Fetch payments
      const paymentsResponse = await fetch(`/api/payments?memberId=${memberId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(Array.isArray(paymentsData) ? paymentsData : []);
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
      toast.error('Error loading member details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-electric-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl text-center">
          <p className="text-red-500 font-bold uppercase tracking-widest text-sm mb-4">[ MEMBER NOT FOUND ]</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-wider hover:text-industrial-50 transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription
    ? Math.ceil((subscription.end_date - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-obsidian-700 shrink-0">
          <h2 className="text-2xl font-bold text-industrial-50 uppercase tracking-wide">Member Details</h2>
          <button
            onClick={onClose}
            className="text-industrial-400 hover:text-industrial-50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
          {/* Left Column: Details & Subscription */}
          <div className="space-y-6 flex flex-col overflow-y-auto pr-2 custom-scrollbar">
            {/* Member Info Card */}
            <div className="bg-obsidian-900 border border-obsidian-700/50 rounded-lg p-6 border-l-4 border-l-electric-500 relative shrink-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Name</p>
                  <p className="text-xl font-bold text-industrial-50 uppercase">{member.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Phone</p>
                  <p className="text-lg font-mono text-industrial-300">{member.phone}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Email</p>
                  <p className="text-sm font-mono text-industrial-300">{member.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="text-sm text-industrial-50 uppercase tracking-wider">{member.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Blood Group</p>
                  <p className="text-sm text-industrial-50 uppercase font-mono">{member.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border inline-block ${member.is_active ? 'bg-electric-500/10 border-electric-500/30 text-electric-500' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
                    {member.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {member.address && (
                <div className="mt-6 pt-4 border-t border-obsidian-700/50">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Address</p>
                  <p className="text-sm text-industrial-300">{member.address}</p>
                </div>
              )}
              {member.medical_notes && (
                <div className="mt-4">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Medical Notes</p>
                  <p className="text-sm text-industrial-300">{member.medical_notes}</p>
                </div>
              )}
            </div>

            {/* Fee Plan Card */}
            {subscription ? (
              <div className="bg-obsidian-900 border border-obsidian-700/50 rounded-lg p-6 border-l-4 border-l-steelgold-500 shrink-0">
                <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-4">Fee Plan Subscription</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Plan Name</p>
                    <p className="text-lg font-bold text-steelgold-500 uppercase">{subscription.plan_name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Monthly Fee</p>
                    <p className="text-lg font-mono font-bold text-industrial-50">{formatCurrency(subscription.monthly_fee)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Duration</p>
                    <p className="text-sm font-mono text-industrial-300">{subscription.duration} MONTHS</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Status</p>
                    <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border inline-block ${subscription.status === 'active' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                      subscription.status === 'expiring_soon' ? 'bg-steelgold-500/10 border-steelgold-500/30 text-steelgold-500' :
                        'bg-red-500/10 border-red-500/30 text-red-500'
                      }`}>
                      {subscription.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-4 border-t border-obsidian-700/50">
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Start Date</p>
                    <p className="text-sm font-mono text-industrial-300">{formatDate(subscription.start_date)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">End Date</p>
                    <p className="text-sm font-mono text-industrial-300">{formatDate(subscription.end_date)}</p>
                  </div>
                </div>

                {daysRemaining !== null && (
                  <div className="mt-6 p-4 rounded bg-obsidian-800 border border-obsidian-600 flex justify-between items-center">
                    <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Days Remaining</p>
                    <p className={`text-xl font-mono font-bold ${daysRemaining > 30 ? 'text-green-500' :
                      daysRemaining > 0 ? 'text-steelgold-500' :
                        'text-red-500'
                      }`}>
                      {daysRemaining > 0 ? daysRemaining : 'EXPIRED'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-obsidian-900 border border-obsidian-700/50 rounded-lg p-6 border-l-4 border-l-red-500 shrink-0">
                <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">[ NO ACTIVE FEE PLAN ]</p>
              </div>
            )}
          </div>

          {/* Right Column: Payments */}
          <div className="flex flex-col h-[600px] lg:h-auto">
            {/* Payments Section */}
            <div className="bg-obsidian-900 border border-obsidian-700/50 rounded-lg p-6 border-l-4 border-l-green-500 flex-1 flex flex-col h-full min-h-0">
              <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-4">Payment History</h3>

              {payments && payments.length > 0 ? (
                <div className="flex flex-col h-full">
                  <div className="overflow-x-auto overflow-y-auto border border-obsidian-600 rounded flex-1 custom-scrollbar">
                    <table className="w-full text-sm">
                      <thead className="bg-obsidian-900 border-b border-obsidian-600 sticky top-0 z-10">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Date</th>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Amount</th>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Type</th>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Mode</th>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Txn ID</th>
                          <th className="text-left py-3 px-4 font-semibold text-[10px] text-industrial-400 uppercase tracking-widest">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-obsidian-700/50">
                        {payments.map((payment) => (
                          <tr key={payment.id} className="hover:bg-obsidian-700/30 transition-colors">
                            <td className="py-3 px-4 font-mono text-xs text-industrial-300">{formatDate(payment.payment_date)}</td>
                            <td className="py-3 px-4 font-mono font-bold text-green-500">{formatCurrency(payment.amount)}</td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                                {payment.payment_type}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-0.5 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                                {payment.payment_mode}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-industrial-400 text-xs font-mono">{payment.transaction_id || '-'}</td>
                            <td className="py-3 px-4 text-industrial-400 text-xs">{payment.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Payment Summary */}
                  <div className="mt-6 p-4 rounded bg-obsidian-800 border border-obsidian-600">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="text-2xl font-mono font-bold text-green-500">
                          {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Payments</p>
                        <p className="text-2xl font-mono font-bold text-industrial-50">{payments.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Latest</p>
                        <p className="text-lg font-mono text-industrial-300">
                          {formatDate(payments[0]?.payment_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest font-mono">[ NO PAYMENTS RECORDED YET ]</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-8 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-wider hover:text-industrial-50 hover:border-industrial-400 transition-colors"
          >
            CLOSE DETAILS
          </button>
        </div>
      </div>
    </div>
  );
}
