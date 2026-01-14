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

  if (loading) return <div className="p-4">Loading fee plans...</div>;

  return (
    <div className="p-6 bg-white rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Fee Plans</h2>
        <button
          onClick={handleAddClick}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          + Add Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="border rounded-lg p-4 hover:shadow-lg">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-gray-600 mb-2">{plan.duration} months</p>

            <div className="space-y-2 text-sm mb-4">
              <p>Monthly: {formatCurrency(plan.monthly_fee)}</p>
              <p>Admission: {formatCurrency(plan.admission_fee)}</p>
              <p>Registration: {formatCurrency(plan.registration_fee)}</p>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => handleEditClick(plan)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="flex-1 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4">{title}</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={plan.name || ''}
              onChange={(e) => onChange({ ...plan, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Duration (months)</label>
            <input
              type="number"
              value={plan.duration || ''}
              onChange={(e) => onChange({ ...plan, duration: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Monthly Fee</label>
            <input
              type="number"
              value={plan.monthly_fee || ''}
              onChange={(e) => onChange({ ...plan, monthly_fee: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Admission Fee</label>
            <input
              type="number"
              value={plan.admission_fee || ''}
              onChange={(e) => onChange({ ...plan, admission_fee: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Registration Fee</label>
            <input
              type="number"
              value={plan.registration_fee || ''}
              onChange={(e) => onChange({ ...plan, registration_fee: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Security Deposit</label>
            <input
              type="number"
              value={plan.security_deposit || ''}
              onChange={(e) => onChange({ ...plan, security_deposit: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              value={plan.description || ''}
              onChange={(e) => onChange({ ...plan, description: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={2}
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
