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

  const resetForm = () => {
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
    setMemberSearchTerm('');
    setShowMemberDropdown(false);
    setPartnerSearchTerm('');
    setShowPartnerDropdown(false);
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
        resetForm();
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const selectedPlan = feePlans.find(p => p.id === formData.feePlanId);
  const isNewMember = selectedMember && !selectedMember.subscription;
  const admissionFee = isNewMember && selectedPlan ? (selectedPlan.admission_fee || 0) : 0;

  const amountDueNum = parseFloat(formData.amountDue) || 0;
  const amountPaidNum = parseFloat(formData.amountPaid) || 0;
  const balance = Math.max(0, Math.round(((amountDueNum - amountPaidNum) + Number.EPSILON) * 100) / 100);
  const isPartial = amountDueNum > 0 && amountPaidNum < amountDueNum && amountPaidNum > 0;

  return (
    <div className="fixed inset-0 bg-obsidian-900/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-obsidian-800 border border-obsidian-600 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-obsidian-700">
          <h3 className="text-xl font-bold text-industrial-50 uppercase tracking-tight">Record Payment</h3>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-obsidian-700 rounded-lg transition-colors group"
          >
            <X className="w-5 h-5 text-obsidian-400 group-hover:text-industrial-50" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Member Search Select */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Member *</label>
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
              placeholder={loadingMembers ? "LOADING MEMBERS..." : "SEARCH BY NAME OR PHONE..."}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all placeholder:text-obsidian-500 uppercase tracking-wide"
              disabled={loadingMembers}
            />
            {showMemberDropdown && memberSearchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-obsidian-900 border border-obsidian-600 rounded-lg shadow-xl max-h-60 overflow-y-auto font-mono">
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => handleMemberChange(member.id)}
                      className="px-4 py-3 hover:bg-obsidian-800 cursor-pointer border-b border-obsidian-800 last:border-0 transition-colors"
                    >
                      <div className="font-bold text-industrial-50">{member.name}</div>
                      <div className="text-xs text-obsidian-400 mt-1">{member.phone} {member.subscription ? '' : <span className="text-electric-500 ml-2 font-sans uppercase tracking-widest text-[10px]">• New Member</span>}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-4 text-xs text-obsidian-400 text-center uppercase tracking-widest">[ NO MEMBERS FOUND ]</div>
                )}
              </div>
            )}
          </div>

          {/* Member Status Indicator */}
          {selectedMember && (
            <div className={`p-4 rounded-lg border ${selectedMember.subscription
              ? 'bg-electric-500/10 border-electric-500/30'
              : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
              <p className={`text-xs font-bold uppercase tracking-widest ${selectedMember.subscription ? 'text-electric-500' : 'text-yellow-500'}`}>
                {selectedMember.subscription
                  ? '✓ Existing Member — Renewal (No Admission Fee)'
                  : '★ New Member — First Time Payment'}
              </p>
              {selectedMember.subscription && (
                <p className="text-xs text-industrial-300 mt-2 font-mono">
                  Current Plan: <span className="text-industrial-50">{selectedMember.subscription.plan_name}</span>
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
              <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg>
                    Outstanding Balance
                  </p>
                  <p className="text-xs text-red-400 mt-1 font-mono">This member has an unpaid balance of <span className="font-bold text-red-300">₹{activePartial.balance.toFixed(2)}</span>.</p>
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
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors shadow-lg shadow-red-500/20"
                >
                  SETTLE BALANCE
                </button>
              </div>
            );
          })()}

          {/* Fee Plan Select */}
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Fee Plan *</label>
            <select
              value={formData.feePlanId}
              onChange={(e) => handleFeePlanChange(e.target.value)}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all"
              disabled={loadingPlans || !formData.memberId}
            >
              <option value="">
                {loadingPlans ? 'LOADING PLANS...' : 'SELECT A FEE PLAN'}
              </option>
              {feePlans.map((plan) => (
                <option key={plan.id} value={plan.id} className="font-mono">
                  {plan.name} — ₹{plan.monthly_fee} ({plan.duration} months)
                </option>
              ))}
            </select>
          </div>

          {/* Fee Breakdown */}
          {formData.feePlanId && selectedPlan && selectedMember && (
            <div className="bg-obsidian-900 border border-obsidian-700 p-4 rounded-lg">
              <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-3">Fee Breakdown</p>
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between text-industrial-300">
                  <span>Monthly Fee:</span>
                  <span className="font-bold text-industrial-50">₹{selectedPlan.monthly_fee}</span>
                </div>
                {isNewMember && admissionFee > 0 && (
                  <div className="flex justify-between text-yellow-500">
                    <span>Admission Fee (New Member):</span>
                    <span className="font-bold">₹{admissionFee}</span>
                  </div>
                )}
                <div className="border-t border-obsidian-700 pt-2 mt-2 flex justify-between font-bold text-electric-500 text-sm">
                  <span>TOTAL DUE:</span>
                  <span>₹{selectedPlan.monthly_fee + admissionFee}</span>
                </div>
              </div>
            </div>
          )}

          {/* Couple Package Partner Selection */}
          {!!feePlans.find(plan => plan.id === formData.feePlanId)?.is_couple_package && (
            <div className="bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg space-y-4">
              <label className="block text-[10px] font-bold text-purple-400 uppercase tracking-widest border-l-2 border-purple-500 pl-2">
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
                  placeholder="SEARCH PARTNER BY NAME OR PHONE..."
                  className="w-full px-4 py-2.5 bg-obsidian-900 border border-purple-500/30 rounded text-industrial-50 focus:border-purple-500 focus:outline-none font-mono text-sm transition-all placeholder:text-obsidian-500 uppercase tracking-wide"
                  required={!formData.coupleMemberId}
                />
                {showPartnerDropdown && partnerSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-obsidian-900 border border-purple-500/30 rounded-lg shadow-xl max-h-60 overflow-y-auto font-mono">
                    {filteredPartners.length > 0 ? (
                      filteredPartners.map((partner) => (
                        <div
                          key={partner.id}
                          onClick={() => handlePartnerChange(partner.id)}
                          className="px-4 py-3 hover:bg-obsidian-800 cursor-pointer border-b border-obsidian-800 last:border-0 transition-colors"
                        >
                          <div className="font-bold text-industrial-50">{partner.name}</div>
                          <div className="text-xs text-purple-400 mt-1">{partner.phone}</div>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-4 text-xs text-obsidian-400 text-center uppercase tracking-widest">[ NO PARTNER FOUND ]</div>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-purple-400/80 font-mono leading-relaxed uppercase tracking-widest">
                Note: The payment amount and due balance will be automatically split exactly in half (50%) between <span className="text-industrial-50">{selectedMember?.name}</span> and the chosen partner. Two separate payment records and subscriptions will be generated.
              </p>
            </div>
          )}

          {/* Total Due + Amount Paid + Balance — 3-column row */}
          {/* Total Due + Amount Paid + Balance — 3-column row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Total Due (₹) *</label>
              <input
                type="number"
                value={formData.amountDue}
                onChange={(e) => setFormData({ ...formData, amountDue: e.target.value })}
                className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Amount Paid (₹) *</label>
              <input
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({ ...formData, amountPaid: e.target.value })}
                className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Balance (₹)</label>
              <div className={`px-4 py-2.5 rounded border font-bold text-sm font-mono flex items-center h-[42px] ${balance > 0
                ? 'bg-red-500/10 border-red-500/30 text-red-500'
                : 'bg-electric-500/10 border-electric-500/30 text-electric-500'
                }`}>
                ₹{balance.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Partial payment warning */}
          {isPartial && (
            <div className="flex items-center gap-2 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg text-xs text-orange-500 font-mono uppercase tracking-widest">
              <span className="font-bold">PARTIAL PAYMENT</span>
              <span>— ₹{balance.toFixed(2)} will remain outstanding</span>
            </div>
          )}

          {/* Payment Mode */}
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 border-l-2 border-electric-500 pl-2">Payment Mode *</label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all"
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
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Transaction ID</label>
            <input
              type="text"
              value={formData.transactionId}
              onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all placeholder:text-obsidian-500 uppercase tracking-wide"
              placeholder="TRANSACTION ID (OPTIONAL)"
            />
          </div>

          {/* Receipt No */}
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Receipt No</label>
            <input
              type="text"
              value={formData.receiptNo}
              onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all placeholder:text-obsidian-500 uppercase tracking-wide"
              placeholder="RECEIPT NUMBER (OPTIONAL)"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-1 pl-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-obsidian-900 border border-obsidian-600 rounded text-industrial-50 focus:border-electric-500 focus:outline-none font-mono text-sm transition-all placeholder:text-obsidian-500 uppercase tracking-wide resize-none"
              placeholder="ADDITIONAL NOTES"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-obsidian-700 flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-6 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 rounded text-xs font-bold uppercase tracking-wider hover:text-industrial-50 transition-colors focus:ring-2 focus:ring-obsidian-500 disabled:opacity-50"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`px-6 py-2 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 shadow-lg ${isPartial ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-electric-500 hover:bg-electric-600 shadow-electric-500/20'
              }`}
          >
            {loading ? 'RECORDING...' : isPartial ? 'RECORD PARTIAL PAYMENT' : 'RECORD PAYMENT'}
          </button>
        </div>
      </div>
    </div>
  );
}
