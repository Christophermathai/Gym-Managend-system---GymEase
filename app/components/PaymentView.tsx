'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { formatDate, formatCurrency } from '../lib/utils';

interface Payment {
  id: number;
  member_id: number;
  amount: number;
  payment_date: string;
  payment_type: string;
  payment_mode: string;
  transaction_id: string;
  notes: string;
  member_name?: string;
  member_phone?: string;
}

export function PaymentView() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');

  useEffect(() => {
    if (token) {
      fetchPayments();
    }
  }, [token]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.error('No token available in auth context');
        toast.error('Authentication required. Please log in again.');
        return;
      }

      console.log('Fetching payments with token from context');
      
      const response = await fetch('/api/payments', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch payments');
      }
      const data = await response.json();
      const paymentsList = Array.isArray(data) ? data : data.payments || [];
      
      // Sort by payment date descending (most recent first)
      paymentsList.sort((a: Payment, b: Payment) => {
        return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
      });
      
      setPayments(paymentsList);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch = 
      (payment.member_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (payment.member_phone || '').includes(searchTerm) ||
      (payment.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || payment.payment_type === filterType;
    const matchesMode = filterMode === 'all' || payment.payment_mode === filterMode;
    
    return matchesSearch && matchesType && matchesMode;
  });

  const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = filteredPayments.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Payments</p>
          <p className="text-2xl font-bold text-blue-900">{totalPayments}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Total Amount</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-600 font-medium">Average Payment</p>
          <p className="text-2xl font-bold text-purple-900">
            {totalPayments > 0 ? formatCurrency(totalAmount / totalPayments) : formatCurrency(0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by Member, Phone, or Transaction ID
            </label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="admission">Admission</option>
              <option value="extra_charge">Extra Charge</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="check">Check</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchPayments}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length > 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Member</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Mode</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Transaction ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                      {payment.member_name || `Member #${payment.member_id}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {payment.member_phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.payment_type === 'membership'
                          ? 'bg-blue-100 text-blue-800'
                          : payment.payment_type === 'admission'
                          ? 'bg-purple-100 text-purple-800'
                          : payment.payment_type === 'extra_charge'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {payment.payment_type === 'extra_charge' ? 'Extra Charge' : 
                         payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payment.payment_mode === 'cash'
                          ? 'bg-green-100 text-green-800'
                          : payment.payment_mode === 'card'
                          ? 'bg-blue-100 text-blue-800'
                          : payment.payment_mode === 'bank_transfer'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.payment_mode === 'bank_transfer' ? 'Bank Transfer' :
                         payment.payment_mode.charAt(0).toUpperCase() + payment.payment_mode.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(payment.payment_date)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                      {payment.transaction_id || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={payment.notes}>
                      {payment.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No payments found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}
