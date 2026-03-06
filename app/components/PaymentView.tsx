'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Edit2, Check, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { formatDate, formatCurrency } from '../lib/utils';

interface Payment {
  id: number;
  member_id: number;
  amount: number;
  amount_due: number;
  balance: number;
  payment_date: string | number;
  payment_type: string;
  payment_mode: string;
  status: string;
  transaction_id: string;
  receipt_no?: string;
  notes: string;
  member_name?: string;
  member_phone?: string;
}

type SortKey = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'member_name';

export function PaymentView() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMode, setFilterMode] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('date_desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Note editing state
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editingNoteValue, setEditingNoteValue] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    if (token) fetchPayments();
  }, [token]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      if (!token) return;
      const response = await fetch('/api/payments', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch payments');
      }
      const data = await response.json();
      setPayments(Array.isArray(data) ? data : data.payments || []);
    } catch (error) {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  // Filter + sort (memoised)
  const filteredPayments = useMemo(() => {
    let list = payments.filter((p) => {
      const matchesSearch =
        (p.member_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.member_phone || '').includes(searchTerm) ||
        (p.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.receipt_no || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = filterType === 'all' || p.payment_type === filterType;
      const matchesMode = filterMode === 'all' || p.payment_mode === filterMode;
      const matchesStatus = filterStatus === 'all' || p.status === filterStatus;

      // Date range
      const ts = typeof p.payment_date === 'number' ? p.payment_date : new Date(p.payment_date).getTime();
      const matchesFrom = !fromDate || ts >= new Date(fromDate).getTime();
      const matchesTo = !toDate || ts <= new Date(toDate).getTime() + 86399999;

      return matchesSearch && matchesType && matchesMode && matchesStatus && matchesFrom && matchesTo;
    });

    list = [...list].sort((a, b) => {
      const tsA = typeof a.payment_date === 'number' ? a.payment_date : new Date(a.payment_date).getTime();
      const tsB = typeof b.payment_date === 'number' ? b.payment_date : new Date(b.payment_date).getTime();
      if (sortBy === 'date_desc') return tsB - tsA;
      if (sortBy === 'date_asc') return tsA - tsB;
      if (sortBy === 'amount_desc') return b.amount - a.amount;
      if (sortBy === 'amount_asc') return a.amount - b.amount;
      if (sortBy === 'member_name') return (a.member_name || '').localeCompare(b.member_name || '');
      return 0;
    });

    return list;
  }, [payments, searchTerm, filterType, filterMode, filterStatus, sortBy, fromDate, toDate]);

  const totalAmount = filteredPayments.reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = filteredPayments.reduce((s, p) => s + (p.balance || 0), 0);
  const totalPartial = filteredPayments.filter(p => p.status === 'partial').length;

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      pending: 'bg-gray-100 text-gray-700',
      failed: 'bg-red-100 text-red-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  const handleEditNote = (payment: Payment) => {
    setEditingNoteId(payment.id);
    setEditingNoteValue(payment.notes || '');
  };

  const handleSaveNote = async () => {
    if (!editingNoteId) return;

    try {
      setSavingNote(true);
      const response = await fetch('/api/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id: editingNoteId, notes: editingNoteValue })
      });

      if (!response.ok) throw new Error('Failed to update note');

      // Update local state
      setPayments(payments.map(p =>
        p.id === editingNoteId ? { ...p, notes: editingNoteValue } : p
      ));
      toast.success('Note updated successfully');
      setEditingNoteId(null);
    } catch (error) {
      toast.error('Failed to update note');
    } finally {
      setSavingNote(false);
    }
  };

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">Total Payments</p>
          <p className="text-2xl font-bold text-blue-900">{filteredPayments.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">Amount Collected</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-900">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">Partial Payments</p>
          <p className="text-2xl font-bold text-orange-900">{totalPartial}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
        {/* Row 1: search + status + type + mode */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search</label>
            <input
              type="text"
              placeholder="Member, phone, Rcpt . No ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="partial">Partial</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="membership">Membership</option>
              <option value="admission">Admission</option>
              <option value="extra_charge">Extra Charge</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Payment Mode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Modes</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>
        </div>

        {/* Row 2: date range + sort + refresh */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date_desc">Date (Newest first)</option>
              <option value="date_asc">Date (Oldest first)</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
              <option value="member_name">Member Name</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('all');
                setFilterMode('all');
                setFilterStatus('all');
                setSortBy('date_desc');
                setFromDate('');
                setToDate('');
              }}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={fetchPayments}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Refresh
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
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Member</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Phone</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Due</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Paid</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Balance</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Mode</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Rcpt No</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {payment.member_name || `Member #${payment.member_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{payment.member_phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {payment.amount_due > 0 ? formatCurrency(payment.amount_due) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-green-700">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold">
                      {(payment.balance || 0) > 0 ? (
                        <span className="text-red-600">{formatCurrency(payment.balance)}</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge(payment.status)}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.payment_type === 'membership' ? 'bg-blue-100 text-blue-800' :
                        payment.payment_type === 'admission' ? 'bg-purple-100 text-purple-800' :
                          payment.payment_type === 'extra_charge' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                        }`}>
                        {payment.payment_type === 'extra_charge' ? 'Extra' :
                          payment.payment_type.charAt(0).toUpperCase() + payment.payment_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${payment.payment_mode === 'cash' ? 'bg-green-100 text-green-800' :
                        payment.payment_mode === 'card' ? 'bg-blue-100 text-blue-800' :
                          payment.payment_mode === 'bank_transfer' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-gray-100 text-gray-800'
                        }`}>
                        {payment.payment_mode === 'bank_transfer' ? 'Bank' :
                          payment.payment_mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">{payment.receipt_no || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-pre-wrap max-w-xs group relative">
                      {editingNoteId === payment.id ? (
                        <div className="flex items-center gap-2">
                          <textarea
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            className="w-full text-sm border rounded p-1 focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                            autoFocus
                            disabled={savingNote}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={handleSaveNote}
                              disabled={savingNote}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              disabled={savingNote}
                              className="p-1 text-gray-400 hover:bg-gray-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <span>{payment.notes || '—'}</span>
                          <button
                            onClick={() => handleEditNote(payment)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all flex-shrink-0"
                            title="Edit notes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-gray-50 border-t text-xs text-gray-500">
            {filteredPayments.length} record{filteredPayments.length !== 1 ? 's' : ''}
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
