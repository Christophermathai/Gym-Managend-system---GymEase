'use client';

import { useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import LottieLoader from './LottieLoader';

interface AddUtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUtilityModal({ isOpen, onClose, onSuccess }: AddUtilityModalProps) {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    description: '',
    category: 'utilities',
    amount: '',
    expenseDate: Date.now(),
    paymentMode: 'cash',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    console.log('handleSubmit called with formData:', formData);

    if (!formData.description || !formData.amount || !formData.category || !formData.paymentMode) {
      console.log('Validation failed:', {
        description: !formData.description,
        amount: !formData.amount,
        category: !formData.category,
        paymentMode: !formData.paymentMode,
      });
      toast.error('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      console.log('Sending expense data:', {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        paymentMode: formData.paymentMode,
        notes: formData.notes,
      });

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          expenseDate: formData.expenseDate,
          paymentMode: formData.paymentMode,
          notes: formData.notes,
        }),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        toast.success('Utility recorded successfully');
        setFormData({
          description: '',
          category: 'utilities',
          amount: '',
          expenseDate: Date.now(),
          paymentMode: 'cash',
          notes: '',
        });
        onSuccess();
        onClose();
      } else {
        toast.error(`Error: ${data.error || 'Failed to record utility'}`);
      }
    } catch (error) {
      console.error('Error recording utility:', error);
      toast.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 w-full max-w-md max-h-120 overflow-y-auto shadow-2xl">
        <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">Record Utility/Expense</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Description *</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
              placeholder="e.g., Monthly electricity bill"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Category *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
            >
              <option value="utilities">Utilities</option>
              <option value="rent">Rent</option>
              <option value="equipment">Equipment</option>
              <option value="salaries">Salaries</option>
              <option value="marketing">Marketing</option>
              <option value="miscellaneous">Miscellaneous</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Amount *</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono"
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Payment Mode *</label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none resize-none"
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-wider hover:text-industrial-50 transition-colors focus:ring-2 focus:ring-obsidian-500"
            disabled={loading}
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-electric-500 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-electric-600 transition-colors disabled:opacity-50 flex items-center gap-2 focus:ring-2 focus:ring-electric-500 focus:ring-offset-2 focus:ring-offset-obsidian-900 shadow-lg shadow-electric-500/20"
            disabled={loading}
          >
            {loading ? (
              <>
                <LottieLoader size={130} className="text-white" />
                RECORDING...
              </>
            ) : 'RECORD UTILITY'}
          </button>
        </div>
      </div>
    </div>
  );
}
