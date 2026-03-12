'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { formatCurrency } from '@/app/lib/utils';

interface FeePlan {
  id: string;
  name: string;
  duration: number;
  monthly_fee: number;
  admission_fee: number;
  registration_fee: number;
  security_deposit: number;
  is_personal_training: boolean;
  is_couple_package: boolean;
  is_active: boolean;
  description?: string;
}

export function FeePlanManagement() {
  const { token } = useAuth();
  const [plans, setPlans] = useState<FeePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<FeePlan | null>(null);
  const [formData, setFormData] = useState<Partial<FeePlan>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/fee-plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPlans(Array.isArray(data) ? data : (data.plans || []));
      } else {
        setPlans([]);
      }
    } catch (error) {
      toast.error('Failed to fetch fee plans');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (plan: FeePlan) => {
    setEditingPlan(plan);
    setFormData(plan);
    setShowEditModal(true);
  };

  const handleAddClick = () => {
    setEditingPlan(null);
    setFormData({});
    setShowAddModal(true);
  };

  const handleSave = async () => {
    if (!editingPlan) return;

    try {
      const response = await fetch(`/api/fee-plans/${editingPlan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Fee plan updated successfully');
        setShowEditModal(false);
        fetchPlans();
      } else {
        toast.error('Failed to update fee plan');
      }
    } catch (error) {
      toast.error('Error updating fee plan');
    }
  };

  const handleAdd = async () => {
    try {
      const response = await fetch('/api/fee-plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Fee plan created successfully');
        setShowAddModal(false);
        fetchPlans();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to create fee plan');
      }
    } catch (error) {
      toast.error('Error creating fee plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this fee plan?')) return;

    try {
      const response = await fetch(`/api/fee-plans/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        toast.success('Fee plan deleted successfully');
        fetchPlans();
      } else {
        toast.error('Failed to delete fee plan');
      }
    } catch (error) {
      toast.error('Error deleting fee plan');
    }
  };

  if (loading) return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
    </div>
  );

  return (
    <div className="p-6 bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6 border-b border-obsidian-700 pb-4">
        <h2 className="text-2xl font-bold text-industrial-50 font-sans tracking-tight">Fee Plans</h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="relative bg-obsidian-900 border border-obsidian-600 rounded p-5 hover:border-electric-500/50 hover:shadow-lg hover:shadow-electric-900/10 transition-all group flex flex-col">
            <div className="mb-4 bg-obsidian-800 -mx-5 -mt-5 p-4 border-b border-obsidian-600 rounded-t flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-wide">{plan.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-electric-500 font-mono text-sm font-bold">{plan.duration} MO.</span>
                  {plan.is_active ? (
                    <span className="px-1.5 py-0.5 bg-green-500/10 border border-green-500/30 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded-[2px]">Active</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-wider rounded-[2px]">Inactive</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {plan.is_personal_training && (
                <span className="px-2 py-1 bg-obsidian-700 border border-obsidian-600 text-electric-500 text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                  PT Plan
                </span>
              )}
              {plan.is_couple_package && (
                <span className="px-2 py-1 bg-obsidian-700 border border-obsidian-600 text-steelgold-500 text-[10px] font-bold uppercase tracking-wider rounded-[2px]">
                  Couple Pkg
                </span>
              )}
            </div>

            <div className="space-y-2 text-sm mb-6 flex-1 font-mono text-industrial-300">
              <div className="flex justify-between border-b border-obsidian-700/50 pb-1">
                <span className="text-industrial-400">Monthly</span>
                <span className="text-industrial-50">{formatCurrency(plan.monthly_fee)}</span>
              </div>
              <div className="flex justify-between border-b border-obsidian-700/50 pb-1">
                <span className="text-industrial-400">Admission</span>
                <span className="text-industrial-50">{formatCurrency(plan.admission_fee)}</span>
              </div>
              <div className="flex justify-between border-b border-obsidian-700/50 pb-1">
                <span className="text-industrial-400">Registration</span>
                <span className="text-industrial-50">{formatCurrency(plan.registration_fee)}</span>
              </div>
              {plan.security_deposit > 0 && (
                <div className="flex justify-between border-b border-obsidian-700/50 pb-1">
                  <span className="text-industrial-400">Security Dep.</span>
                  <span className="text-industrial-50">{formatCurrency(plan.security_deposit)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(plan)}
                className="flex-1 px-3 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold tracking-wider hover:border-industrial-400 hover:text-industrial-50 transition-colors uppercase"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="px-3 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-xs font-bold tracking-wider hover:bg-red-500/20 transition-colors uppercase"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingPlan && (
        <PlanModal
          plan={formData as FeePlan}
          onChange={setFormData}
          onSave={handleSave}
          onClose={() => setShowEditModal(false)}
          title="Edit Fee Plan"
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <PlanModal
          plan={formData as FeePlan}
          onChange={setFormData}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
          title="Add Fee Plan"
        />
      )}
    </div>
  );
}

function PlanModal({
  plan,
  onChange,
  onSave,
  onClose,
  title,
}: {
  plan: FeePlan;
  onChange: (data: Partial<FeePlan>) => void;
  onSave: () => void;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-6 text-industrial-50 border-b border-obsidian-700 pb-2">{title}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Name</label>
            <input
              type="text"
              value={plan.name || ''}
              onChange={(e) => onChange({ ...plan, name: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none placeholder:text-obsidian-500"
              placeholder="e.g. Premium Access"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Duration (mo)</label>
              <input
                type="number"
                value={plan.duration || ''}
                onChange={(e) => onChange({ ...plan, duration: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono placeholder:text-obsidian-500"
                placeholder="12"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Monthly Fee</label>
              <input
                type="number"
                value={plan.monthly_fee || ''}
                onChange={(e) => onChange({ ...plan, monthly_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono placeholder:text-obsidian-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Admission Fee</label>
              <input
                type="number"
                value={plan.admission_fee || ''}
                onChange={(e) => onChange({ ...plan, admission_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono placeholder:text-obsidian-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Reg. Fee</label>
              <input
                type="number"
                value={plan.registration_fee || ''}
                onChange={(e) => onChange({ ...plan, registration_fee: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono placeholder:text-obsidian-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Security Deposit</label>
            <input
              type="number"
              value={plan.security_deposit || ''}
              onChange={(e) => onChange({ ...plan, security_deposit: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono placeholder:text-obsidian-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-industrial-400 uppercase mb-1">Description</label>
            <textarea
              value={plan.description || ''}
              onChange={(e) => onChange({ ...plan, description: e.target.value })}
              className="w-full px-3 py-2 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none placeholder:text-obsidian-500"
              rows={2}
              placeholder="Features, conditions, etc..."
            />
          </div>

          <div className="grid gap-3 pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-2 bg-obsidian-900/50 border border-obsidian-600 rounded hover:border-electric-500 transition-colors">
              <input
                type="checkbox"
                checked={plan.is_personal_training || false}
                onChange={(e) => onChange({ ...plan, is_personal_training: e.target.checked })}
                className="w-4 h-4 bg-obsidian-900 border-obsidian-600 text-electric-500 focus:ring-electric-500 rounded-sm"
              />
              <span className="text-sm font-bold text-industrial-300 uppercase tracking-widest">Personal Training Plan</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2 bg-obsidian-900/50 border border-obsidian-600 rounded hover:border-electric-500 transition-colors">
              <input
                type="checkbox"
                checked={plan.is_couple_package || false}
                onChange={(e) => onChange({ ...plan, is_couple_package: e.target.checked })}
                className="w-4 h-4 bg-obsidian-900 border-obsidian-600 text-steelgold-500 focus:ring-steelgold-500 rounded-sm"
              />
              <span className="text-sm font-bold text-industrial-300 uppercase tracking-widest">Couple Package Plan</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer p-2 bg-obsidian-900/50 border border-obsidian-600 rounded hover:border-green-500 transition-colors mt-2">
              <input
                type="checkbox"
                checked={plan.is_active !== undefined ? plan.is_active : true}
                onChange={(e) => onChange({ ...plan, is_active: e.target.checked })}
                className="w-4 h-4 bg-obsidian-900 border-obsidian-600 text-green-500 focus:ring-green-500 rounded-sm"
              />
              <span className="text-sm font-bold text-industrial-300 uppercase tracking-widest">Active Plan</span>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded hover:text-industrial-50 text-sm font-medium transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-electric-500 text-white rounded hover:bg-electric-600 text-sm font-medium transition-colors"
          >
            SAVE PLAN
          </button>
        </div>
      </div>
    </div>
  );
}
