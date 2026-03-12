'use client';

import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Edit2, Check, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { AnimatePresence } from 'framer-motion';
import { formatDate, formatCurrency } from '../lib/utils';
import LottieLoader from './LottieLoader';

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
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      partial: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      pending: 'bg-obsidian-700 text-industrial-300 border-obsidian-500',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
    };
    return map[status] || 'bg-obsidian-700 text-industrial-300 border-obsidian-500';
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
        <AnimatePresence>
          <LottieLoader size={130} key="payment-loader" />
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 group hover:border-electric-500 transition-colors">
          <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-electric-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Total Payments
          </p>
          <p className="text-3xl font-mono text-industrial-50">{filteredPayments.length}</p>
        </div>
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 group hover:border-green-500 transition-colors">
          <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            Amount Collected
          </p>
          <p className="text-3xl font-mono text-green-500">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 group hover:border-red-500 transition-colors">
          <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
            Balance Due
          </p>
          <p className="text-3xl font-mono text-red-500">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 group hover:border-orange-500 transition-colors">
          <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2 flex items-center gap-2">
            <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path></svg>
            Partial Payments
          </p>
          <p className="text-3xl font-mono text-orange-500">{totalPartial}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 space-y-4">
        {/* Row 1: search + status + type + mode */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Search</label>
            <input
              type="text"
              placeholder="MEMBER, PHONE, RCPT NO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono placeholder:text-obsidian-500 transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase tracking-wide"
            >
              <option value="all">ALL STATUSES</option>
              <option value="completed">COMPLETED</option>
              <option value="partial">PARTIAL</option>
              <option value="pending">PENDING</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Payment Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase tracking-wide"
            >
              <option value="all">ALL TYPES</option>
              <option value="membership">MEMBERSHIP</option>
              <option value="admission">ADMISSION</option>
              <option value="extra_charge">EXTRA CHARGE</option>
              <option value="refund">REFUND</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Payment Mode</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase tracking-wide"
            >
              <option value="all">ALL MODES</option>
              <option value="cash">CASH</option>
              <option value="card">CARD</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">BANK TRANSFER</option>
              <option value="cheque">CHEQUE</option>
            </select>
          </div>
        </div>

        {/* Row 2: date range + sort + refresh */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="w-full px-3 py-2 text-sm bg-obsidian-900 border border-obsidian-600 rounded focus:outline-none focus:border-electric-500 text-industrial-50 font-mono transition-colors uppercase tracking-wide"
            >
              <option value="date_desc">DATE (NEWEST FIRST)</option>
              <option value="date_asc">DATE (OLDEST FIRST)</option>
              <option value="amount_desc">AMOUNT (HIGH TO LOW)</option>
              <option value="amount_asc">AMOUNT (LOW TO HIGH)</option>
              <option value="member_name">MEMBER NAME</option>
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
              className="flex-1 px-3 py-2 text-xs bg-obsidian-700 text-industrial-300 font-bold uppercase tracking-wider rounded hover:text-industrial-50 border border-obsidian-600 transition-colors"
            >
              CLEAR
            </button>
            <button
              onClick={fetchPayments}
              className="flex-1 px-3 py-2 text-xs bg-electric-500 text-white font-bold uppercase tracking-wider rounded hover:bg-electric-600 transition-colors shadow-lg shadow-electric-500/20"
            >
              REFRESH
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {filteredPayments.length > 0 ? (
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-obsidian-900/50 border-b border-obsidian-700">
                <tr>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest pl-6">Member</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Phone</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Due</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Paid</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Balance</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Type</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Mode</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Rcpt No</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-700">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 text-sm text-industrial-50 font-bold pl-6">
                      {payment.member_name || `MEMBER #${payment.member_id}`}
                    </td>
                    <td className="px-4 py-3 text-sm text-industrial-400 font-mono">{payment.member_phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-industrial-300 font-mono">
                      {payment.amount_due > 0 ? formatCurrency(payment.amount_due) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-green-500 font-mono">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold font-mono">
                      {(payment.balance || 0) > 0 ? (
                        <span className="text-red-500">{formatCurrency(payment.balance)}</span>
                      ) : (
                        <span className="text-industrial-500">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${statusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${payment.payment_type === 'membership' ? 'bg-electric-500/10 text-electric-500 border-electric-500/20' :
                        payment.payment_type === 'admission' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          payment.payment_type === 'extra_charge' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                        {payment.payment_type === 'extra_charge' ? 'EXTRA' : payment.payment_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${payment.payment_mode === 'cash' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        payment.payment_mode === 'card' ? 'bg-electric-500/10 text-electric-500 border-electric-500/20' :
                          payment.payment_mode === 'bank_transfer' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                            payment.payment_mode === 'upi' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              'bg-obsidian-700 text-industrial-300 border-obsidian-500'
                        }`}>
                        {payment.payment_mode === 'bank_transfer' ? 'BANK' : payment.payment_mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-industrial-400 font-mono uppercase">{payment.receipt_no || '—'}</td>
                    <td className="px-4 py-3 text-sm text-industrial-400 font-mono uppercase tracking-wide">{formatDate(payment.payment_date)}</td>
                    <td className="px-4 py-3 text-sm text-industrial-400 whitespace-pre-wrap max-w-xs relative font-mono uppercase">
                      {editingNoteId === payment.id ? (
                        <div className="flex items-center gap-2">
                          <textarea
                            value={editingNoteValue}
                            onChange={(e) => setEditingNoteValue(e.target.value)}
                            className="w-full text-xs bg-obsidian-900 border border-obsidian-600 rounded p-2 focus:border-electric-500 focus:outline-none text-industrial-50 min-h-[60px]"
                            autoFocus
                            disabled={savingNote}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={handleSaveNote}
                              disabled={savingNote}
                              className="p-1.5 bg-green-500/20 text-green-500 hover:bg-green-500/30 rounded transition-colors"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingNoteId(null)}
                              disabled={savingNote}
                              className="p-1.5 bg-obsidian-700 text-industrial-400 hover:text-industrial-50 rounded transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-2">
                          <span className="leading-snug">{payment.notes || '—'}</span>
                          <button
                            onClick={() => handleEditNote(payment)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-industrial-500 hover:text-electric-500 hover:bg-electric-500/10 rounded transition-all flex-shrink-0"
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
          <div className="px-6 py-3 bg-obsidian-900/50 border-t border-obsidian-700 text-xs font-mono text-industrial-500 uppercase tracking-widest">
            {filteredPayments.length} RECORD{filteredPayments.length !== 1 ? 'S' : ''}
          </div>
        </div>
      ) : (
        <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-12 text-center flex flex-col items-center">
          <svg className="w-12 h-12 text-obsidian-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
          <p className="text-industrial-400 font-mono text-sm uppercase tracking-widest">NO PAYMENTS FOUND MATCHING CRITERIA</p>
        </div>
      )}
    </div>
  );
}
