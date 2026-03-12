'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/app/lib/utils';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_mode: string;
  receipt_number?: string;
  notes?: string;
}

export function ExpenseManagement() {
  const { token } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<string>('');
  const [formData, setFormData] = useState<Partial<Expense>>({});

  useEffect(() => {
    fetchExpenses();
  }, [category]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const url = category ? `/api/expenses?category=${category}` : '/api/expenses';
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(Array.isArray(data) ? data : (data.expenses || []));
      } else {
        setExpenses([]);
      }
    } catch (error) {
      toast.error('Failed to fetch expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.description || !formData.amount || !formData.expense_date || !formData.payment_mode) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Expense recorded successfully');
        setShowAddModal(false);
        setFormData({});
        fetchExpenses();
      } else {
        toast.error('Failed to record expense');
      }
    } catch (error) {
      toast.error('Error recording expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Expense deleted');
        fetchExpenses();
      }
    } catch (error) {
      toast.error('Error deleting expense');
    }
  };

  if (loading) return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
    </div>
  );

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-obsidian-700 pb-4">
        <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Expenses</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Record Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Category Filter */}
        <div>
          <label className="block text-xs font-bold text-industrial-400 uppercase tracking-wider mb-1.5 border-l-2 border-electric-500 pl-2">Category Filter</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
          >
            <option value="">All Categories</option>
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="equipment">Equipment</option>
            <option value="salaries">Salaries</option>
            <option value="marketing">Marketing</option>
            <option value="miscellaneous">Miscellaneous</option>
          </select>
        </div>

        {/* Summary */}
        <div className="flex flex-col justify-end">
          <div className="p-3 bg-obsidian-900/50 border border-obsidian-600 rounded flex items-center justify-between">
            <span className="text-sm font-bold text-industrial-400 uppercase tracking-widest">Total Expenses</span>
            <span className="text-xl font-bold text-electric-500 font-mono">{formatCurrency(totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto border border-obsidian-600 rounded">
        <table className="w-full text-sm text-left">
          <thead className="bg-obsidian-900 border-b border-obsidian-600">
            <tr>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Date</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Category</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px]">Description</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
              <th className="px-4 py-3 font-semibold text-industrial-400 uppercase tracking-widest text-[10px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-700/50">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-obsidian-700/30 transition-colors group">
                  <td className="px-4 py-3 font-mono text-industrial-300 text-xs">{formatDate(expense.expense_date)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-industrial-50">{expense.description}</td>
                  <td className="px-4 py-3 font-mono font-bold text-electric-500 text-right">{formatCurrency(expense.amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDelete(expense.id)}
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
                <td colSpan={5} className="p-8 text-center text-industrial-400 font-mono text-xs">
                  [ NO EXPENSES RECORDED ]
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
            <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">Record Expense</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                >
                  <option value="">Select category</option>
                  <option value="rent">Rent</option>
                  <option value="utilities">Utilities</option>
                  <option value="equipment">Equipment</option>
                  <option value="salaries">Salaries</option>
                  <option value="marketing">Marketing</option>
                  <option value="miscellaneous">Miscellaneous</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Description *</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Amount *</label>
                  <input
                    type="number"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Date *</label>
                  <input
                    type="date"
                    value={formData.expense_date || ''}
                    onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                    className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono [color-scheme:dark]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1 border-l-2 border-electric-500 pl-2">Payment Mode *</label>
                <select
                  value={formData.payment_mode || ''}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                >
                  <option value="">Select mode</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receipt_number || ''}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
                  rows={2}
                />
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
                RECORD EXPENSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
