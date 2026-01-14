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

  if (loading) return <div className="p-4">Loading expenses...</div>;

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Expenses</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + Record Expense
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-4 py-2 border rounded"
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
      <div className="mb-6 p-4 bg-blue-50 rounded">
        <p className="text-lg font-semibold">Total Expenses: {formatCurrency(totalAmount)}</p>
      </div>

      {/* Expenses Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Date</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="border-b hover:bg-gray-50">
                <td className="p-2">{formatDate(expense.expense_date)}</td>
                <td className="p-2 capitalize">{expense.category}</td>
                <td className="p-2">{expense.description}</td>
                <td className="p-2 text-right font-semibold">{formatCurrency(expense.amount)}</td>
                <td className="p-2 text-center">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Record Expense</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Category *</label>
                <select
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
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
                <label className="block text-sm font-medium">Description *</label>
                <input
                  type="text"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Amount *</label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Expense Date *</label>
                <input
                  type="date"
                  value={formData.expense_date || ''}
                  onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Payment Mode *</label>
                <select
                  value={formData.payment_mode || ''}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select mode</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receipt_number || ''}
                  onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
