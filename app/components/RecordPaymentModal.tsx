'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  subscription?: any;
  payments?: any[];
}

interface FeePlan {
  id: string;
  name: string;
  monthly_fee: number;
  admission_fee: number;
  duration: number;
  is_couple_package?: boolean;
}

export function RecordPaymentModal({ isOpen, onClose, onSuccess }: RecordPaymentModalProps) {
  const { token } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [feePlans, setFeePlans] = useState<FeePlan[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    memberId: '',
    subscriptionId: '',
    amountDue: '',
    amountPaid: '',
    feePlanId: '',
    paymentType: 'membership',
    paymentMode: 'cash',
    transactionId: '',
    receiptNo: '',
    paymentDate: Date.now(),
    notes: '',
    coupleMemberId: '',
    settlePaymentId: '',
  });
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [partnerSearchTerm, setPartnerSearchTerm] = useState('');
  const [showPartnerDropdown, setShowPartnerDropdown] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
      fetchFeePlans();
    }
  }, [isOpen]);

  const fetchMembers = async () => {
    try {
      setLoadingMembers(true);
      const response = await fetch('/api/members?limit=200', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setMembers(data.members || []);
      }
    } catch (error) {
      toast.error('Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchFeePlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await fetch('/api/fee-plans', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setFeePlans(Array.isArray(data) ? data : data.plans || []);
      }
    } catch (error) {
      toast.error('Failed to load fee plans');
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleFeePlanChange = (feePlanId: string) => {
    const plan = feePlans.find(p => p.id === feePlanId);
    if (plan) {
      const hasEverPaidAdmission = selectedMember?.payments?.some(
        (payment: any) => payment.payment_type === 'admission'
      );
      const shouldChargeAdmission = !hasEverPaidAdmission && (plan.admission_fee || 0) > 0;
      const totalAmount = shouldChargeAdmission
        ? plan.monthly_fee + (plan.admission_fee || 0)
        : plan.monthly_fee;

      setFormData(prev => ({
        ...prev,
        feePlanId,
        amountDue: totalAmount.toString(),
        amountPaid: totalAmount.toString(),
      }));
    } else {
      setFormData(prev => ({ ...prev, feePlanId, amountDue: '', amountPaid: '' }));
    }
  };

  const handleMemberChange = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    setSelectedMember(member || null);
    setMemberSearchTerm(member ? `${member.name} (${member.phone})` : '');
    setShowMemberDropdown(false);
    setFormData({ ...formData, memberId, feePlanId: '', amountDue: '', amountPaid: '', settlePaymentId: '' });
  };

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
    member.phone.includes(memberSearchTerm)
  ).slice(0, 3); // Limit to top 3 results

  const filteredPartners = members.filter(m =>
    m.id !== formData.memberId && (
      m.name.toLowerCase().includes(partnerSearchTerm.toLowerCase()) ||
      m.phone.includes(partnerSearchTerm)
    )
  ).slice(0, 3); // Limit to top 3 results

  const handlePartnerChange = (partnerId: string) => {
    const partner = members.find(m => m.id === partnerId);
    setPartnerSearchTerm(partner ? `${partner.name} (${partner.phone})` : '');
    setShowPartnerDropdown(false);
    setFormData({ ...formData, coupleMemberId: partnerId });
  };

  const handleSubmit = async () => {
    if (!formData.memberId || !formData.amountPaid || !formData.paymentMode) {
      toast.error('Please fill required fields');
      return;
    }

    const amountPaid = parseFloat(formData.amountPaid);
    const amountDue = parseFloat(formData.amountDue) || amountPaid;

    if (amountPaid <= 0) {
      toast.error('Amount paid must be greater than 0');
      return;
    }
    if (amountPaid > amountDue) {
      toast.error('Amount paid cannot exceed total due');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          memberId: formData.memberId,
          subscriptionId: formData.subscriptionId,
          feePlanId: formData.feePlanId,
          amount: amountPaid,
          amount_due: amountDue,
          paymentType: formData.paymentType,
          paymentMode: formData.paymentMode,
          transactionId: formData.transactionId,
          receiptNo: formData.receiptNo,
          paymentDate: formData.paymentDate,
          notes: formData.notes,
          coupleMemberId: formData.coupleMemberId,
          settlePaymentId: formData.settlePaymentId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const balance = result.balance || 0;
        if (balance > 0) {
          toast.success(`Payment recorded — ₹${balance.toFixed(2)} balance remaining`);
        } else {
          toast.success('Payment recorded successfully');
        }
        setFormData({
          memberId: '',
          subscriptionId: '',
          amountDue: '',
          amountPaid: '',
          feePlanId: '',
          paymentType: 'membership',
          paymentMode: 'cash',
          transactionId: '',
          receiptNo: '',
          paymentDate: Date.now(),
          notes: '',
          coupleMemberId: '',
          settlePaymentId: '',
        });
        setSelectedMember(null);
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to record payment');
      }
    } catch (error) {
      toast.error('Error recording payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPlan = feePlans.find(p => p.id === formData.feePlanId);
  const isNewMember = selectedMember && !selectedMember.subscription;
  const admissionFee = isNewMember && selectedPlan ? (selectedPlan.admission_fee || 0) : 0;

  const amountDueNum = parseFloat(formData.amountDue) || 0;
  const amountPaidNum = parseFloat(formData.amountPaid) || 0;
  const balance = Math.max(0, amountDueNum - amountPaidNum);
  const isPartial = amountDueNum > 0 && amountPaidNum < amountDueNum && amountPaidNum > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <h3 className="text-2xl font-bold text-gray-900">Record Payment</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Member Search Select */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">Member *</label>
            <input
              type="text"
              value={memberSearchTerm}
              onChange={(e) => {
                setMemberSearchTerm(e.target.value);
                setShowMemberDropdown(true);
                if (e.target.value === '') {
                  handleMemberChange('');
                }
              }}
              onFocus={() => setShowMemberDropdown(true)}
              onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
              placeholder={loadingMembers ? "Loading members..." : "Search by name or phone..."}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loadingMembers}
            />
            {showMemberDropdown && memberSearchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberChange(member.id)}
                      className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                    >
                      <div className="font-medium text-gray-900">{member.name}</div>
                      <div className="text-sm text-gray-500">{member.phone} {member.subscription ? '' : '• New Member'}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No members found matching "{memberSearchTerm}"</div>
                )}
              </div>
            )}
          </div>

          {/* Member Status Indicator */}
          {selectedMember && (
            <div className={`p-4 rounded-lg border ${selectedMember.subscription
              ? 'bg-blue-50 border-blue-200'
              : 'bg-amber-50 border-amber-200'
              }`}>
              <p className="text-sm font-semibold text-gray-900">
                {selectedMember.subscription
                  ? 'Existing Member — Renewal (No Admission Fee)'
                  : 'New Member — First Time Payment'}
              </p>
              {selectedMember.subscription && (
                <p className="text-sm text-gray-600 mt-1">
                  Current Plan: {selectedMember.subscription.plan_name}
                </p>
              )}
            </div>
          )}

          {/* Settle Balance Banner */}
          {(() => {
            const partialPayments = selectedMember?.payments?.filter((p: any) => p.status === 'partial') || [];
            if (partialPayments.length === 0) return null;
            const activePartial = partialPayments[0];

            if (formData.settlePaymentId === activePartial.id) return null;

            return (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-900">Outstanding Balance Detected</p>
                  <p className="text-sm text-orange-700">This member has an unpaid balance of ₹{activePartial.balance.toFixed(2)}.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({
                      ...formData,
                      feePlanId: '',
                      amountDue: activePartial.balance.toString(),
                      amountPaid: activePartial.balance.toString(),
                      paymentType: 'other',
                      notes: 'Settling balance for previous payment',
                      settlePaymentId: activePartial.id
                    });
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition"
                >
                  Settle Balance
                </button>
              </div>
            );
          })()}

          {/* Fee Plan Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Plan *</label>
            <select
              value={formData.feePlanId}
              onChange={(e) => handleFeePlanChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              disabled={loadingPlans || !formData.memberId}
            >
              <option value="">
                {loadingPlans ? 'Loading plans...' : 'Select a fee plan'}
              </option>
              {feePlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — ₹{plan.monthly_fee} ({plan.duration} months)
                </option>
              ))}
            </select>
          </div>

          {/* Fee Breakdown */}
          {formData.feePlanId && selectedPlan && selectedMember && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <p className="text-sm font-semibold text-blue-900 mb-3">Fee Breakdown</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Monthly Fee:</span>
                  <span className="font-semibold">₹{selectedPlan.monthly_fee}</span>
                </div>
                {isNewMember && admissionFee > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>Admission Fee (New Member):</span>
                    <span className="font-semibold">₹{admissionFee}</span>
                  </div>
                )}
                <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold text-blue-900">
                  <span>Total Due:</span>
                  <span>₹{selectedPlan.monthly_fee + admissionFee}</span>
                </div>
              </div>
            </div>
          )}

          {/* Couple Package Partner Selection */}
          {!!feePlans.find(plan => plan.id === formData.feePlanId)?.is_couple_package && (
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg space-y-3">
              <label className="block text-sm font-semibold text-purple-900">
                Select Partner (Couple Package) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={partnerSearchTerm}
                  onChange={(e) => {
                    setPartnerSearchTerm(e.target.value);
                    setShowPartnerDropdown(true);
                    if (e.target.value === '') {
                      handlePartnerChange('');
                    }
                  }}
                  onFocus={() => setShowPartnerDropdown(true)}
                  onBlur={() => setTimeout(() => setShowPartnerDropdown(false), 200)}
                  placeholder="Search partner by name or phone..."
                  className="w-full px-4 py-2.5 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  required={!formData.coupleMemberId} // only required if they haven't picked a valid partner
                />
                {showPartnerDropdown && partnerSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPartners.length > 0 ? (
                      filteredPartners.map((partner) => (
                        <div
                          key={partner.id}
                          onClick={() => handlePartnerChange(partner.id)}
                          className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b last:border-0"
                        >
                          <div className="font-medium text-purple-900">{partner.name}</div>
                          <div className="text-sm text-purple-700">{partner.phone}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">No partner found matching "{partnerSearchTerm}"</div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-xs text-purple-700 font-medium">
                Note: The payment amount and due balance will be automatically split exactly in half (50%) between {selectedMember?.name} and the chosen partner. Two separate payment records and subscriptions will be generated.
              </p>
            </div>
          )}

          {/* Total Due + Amount Paid + Balance — 3-column row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Due (₹) *</label>
              <input
                type="number"
                value={formData.amountDue}
                onChange={(e) => setFormData({ ...formData, amountDue: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid (₹) *</label>
              <input
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Balance (₹)</label>
              <div className={`px-4 py-2.5 rounded-lg border font-semibold text-sm ${balance > 0
                ? 'bg-red-50 border-red-300 text-red-700'
                : 'bg-green-50 border-green-300 text-green-700'
                }`}>
                ₹{balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Partial payment warning */}
          {isPartial && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
              <span className="font-semibold">Partial Payment</span>
              <span>— ₹{balance.toFixed(2)} will remain outstanding</span>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Mode *</label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Transaction ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
            <input
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Transaction ID (optional)"
            />
          </div>

          {/* Receipt No */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Receipt No</label>
            <input
              type="text"
              value={formData.receiptNo}
              onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Receipt Number (optional)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all"
              placeholder="Additional notes"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-sm ${isPartial ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
              }`}
          >
            {loading ? 'Recording...' : isPartial ? 'Record Partial Payment' : 'Record Payment'}
          </button>
        </div>
      </div>
    </div >
  );
}
