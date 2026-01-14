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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <div className="flex justify-center items-center min-h-[300px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <p className="text-red-600">Member not found</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = subscription
    ? Math.ceil((subscription.end_date - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Member Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Member Info Card */}
        <div className="bg-blue-50 rounded-lg p-6 mb-6 border-l-4 border-blue-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Name</p>
              <p className="text-2xl font-bold text-gray-900">{member.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Phone</p>
              <p className="text-2xl font-bold text-gray-900">{member.phone}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Email</p>
              <p className="text-lg text-gray-900">{member.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Gender</p>
              <p className="text-lg capitalize text-gray-900">{member.gender || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Blood Group</p>
              <p className="text-lg text-gray-900">{member.blood_group || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <p className={`text-lg font-semibold ${member.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {member.is_active ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
          {member.address && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Address</p>
              <p className="text-gray-900">{member.address}</p>
            </div>
          )}
          {member.medical_notes && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-600">Medical Notes</p>
              <p className="text-gray-900">{member.medical_notes}</p>
            </div>
          )}
        </div>

        {/* Fee Plan Card */}
        {subscription ? (
          <div className="bg-purple-50 rounded-lg p-6 border-l-4 border-purple-500">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Fee Plan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Plan Name</p>
                <p className="text-2xl font-bold text-purple-600">{subscription.plan_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Fee</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(subscription.monthly_fee)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Duration</p>
                <p className="text-lg text-gray-900">{subscription.duration} days</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Status</p>
                <p className={`text-lg font-semibold capitalize ${
                  subscription.status === 'active' ? 'text-green-600' :
                  subscription.status === 'expiring_soon' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {subscription.status}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-sm font-medium text-gray-600">Start Date</p>
                <p className="text-lg text-gray-900">{formatDate(subscription.start_date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">End Date</p>
                <p className="text-lg text-gray-900">{formatDate(subscription.end_date)}</p>
              </div>
            </div>

            {daysRemaining !== null && (
              <div className="mt-6 p-4 rounded-lg bg-white">
                <p className="text-sm font-medium text-gray-600">Days Remaining</p>
                <p className={`text-3xl font-bold ${
                  daysRemaining > 30 ? 'text-green-600' :
                  daysRemaining > 0 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {daysRemaining > 0 ? daysRemaining : 'Expired'}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 rounded-lg p-6 border-l-4 border-yellow-500">
            <p className="text-yellow-800 font-semibold">No active fee plan</p>
          </div>
        )}

        {/* Payments Section */}
        <div className="mt-6 bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment History</h3>
          
          {payments && payments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-green-100">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Mode</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Transaction ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-green-100 transition-colors">
                      <td className="py-3 px-4">{formatDate(payment.payment_date)}</td>
                      <td className="py-3 px-4 font-semibold text-green-600">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-4 capitalize">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">
                          {payment.payment_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-semibold">
                          {payment.payment_mode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-xs">{payment.transaction_id || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{payment.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Payment Summary */}
              <div className="mt-4 pt-4 border-t-2 border-green-300">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Number of Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Last Payment</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(payments[0]?.payment_date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 font-semibold">No payments recorded yet</p>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
