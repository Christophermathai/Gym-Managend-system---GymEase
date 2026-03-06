'use client';

import { motion, Variants } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModals } from './ModalContext';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { MemberManagement } from './MemberManagement';
import { PaymentChart } from './charts/PaymentChart';

interface DashboardData {
  overview: {
    totalActiveMembers: number;
    pendingPaymentsCount: number;
    paidMembersCount: number;
    partialMembersCount: number;
    newAdmissionsMonth: number;
    expiringMemberships: number;
  };
  pendingMembers: any[];
  expiringMembers: any[];
  recentLeads: any[];
}

export function TrainerDashboard() {
  const { token } = useAuth();
  const { showAddLeadModal, setShowAddMemberModal, setShowPaymentModal, setShowAddLeadModal, setShowAddUtilityModal } = useModals();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [showAssignedLeads, setShowAssignedLeads] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'members'>('dashboard');
  const [memberFilter, setMemberFilter] = useState<'unpaid' | 'partial' | null>(null);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  const handleViewUnpaidMembers = () => {
    setMemberFilter('unpaid');
    setActiveTab('members');
  };

  const handleViewPartialMembers = () => {
    setMemberFilter('partial');
    setActiveTab('members');
  };

  const handleTabChange = (tab: 'dashboard' | 'members') => {
    if (tab !== 'members') setMemberFilter(null);
    setActiveTab(tab);
  };

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      fetchLeads();
      fetchExpenses();
    }
  }, [token]);

  // Refresh leads when modal closes (after adding new lead)
  useEffect(() => {
    if (!showAddLeadModal) {
      // Small delay to ensure the modal has fully closed and data is committed
      const timer = setTimeout(() => {
        fetchLeads();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showAddLeadModal]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/dashboard/trainer', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const dashboardData = await response.json();
        setData(dashboardData);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLeadsLoading(true);
      const endpoint = showAssignedLeads ? '/api/leads/assigned' : '/api/leads';
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setLeads(data.leads || []);
      } else {
        console.error('Failed to fetch leads, status:', response.status);
        setLeads([]);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
      setLeads([]);
    } finally {
      setLeadsLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      setExpensesLoading(true);
      const response = await fetch('/api/expenses/my-expenses', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      } else {
        console.error('Failed to fetch expenses, status:', response.status);
        setExpenses([]);
      }
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to fetch utilities');
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success('Lead status updated');
        fetchLeads(); // Refresh the list
      } else {
        toast.error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Error updating lead');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-gray-500">
        <p className="mb-4">Failed to load dashboard data.</p>
        <button
          onClick={() => {
            setLoading(true); // Reset loading state
            fetchDashboardData();
            fetchLeads();
            fetchExpenses();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const { overview, pendingMembers, expiringMembers, recentLeads } = data;
  const paidCount = overview.paidMembersCount || 0;
  const partialCount = overview.partialMembersCount || 0;
  const unpaidCount = Math.max(0, overview.totalActiveMembers - paidCount - partialCount);

  return (
    <motion.div
      className="space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'dashboard'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'members'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            Members
          </button>
        </nav>
      </div>

      {/* Dashboard View */}
      {activeTab === 'dashboard' && (
        <motion.div
          key="dashboard-view"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Quick Action Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-6 text-center transition-all transform hover:scale-105 border border-blue-200 shadow-sm"
            >
              <div className="text-3xl mb-2">👤</div>
              <p className="font-semibold text-blue-900">Add Member</p>
              <p className="text-sm text-blue-700 mt-1">Register new member</p>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg p-6 text-center transition-all transform hover:scale-105 border border-green-200 shadow-sm"
            >
              <div className="text-3xl mb-2">💳</div>
              <p className="font-semibold text-green-900">Record Fee</p>
              <p className="text-sm text-green-700 mt-1">Track payments</p>
            </button>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg p-6 text-center transition-all transform hover:scale-105 border border-purple-200 shadow-sm"
            >
              <div className="text-3xl mb-2">📞</div>
              <p className="font-semibold text-purple-900">Add Lead</p>
              <p className="text-sm text-purple-700 mt-1">New prospect</p>
            </button>

            <button
              onClick={() => setShowAddUtilityModal(true)}
              className="bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg p-6 text-center transition-all transform hover:scale-105 border border-orange-200 shadow-sm"
            >
              <div className="text-3xl mb-2">⚙️</div>
              <p className="font-semibold text-orange-900">Record Utility</p>
              <p className="text-sm text-orange-700 mt-1">Track expenses</p>
            </button>
          </motion.div>

          {/* Payment Status Chart */}
          <motion.div className="bg-white rounded-lg shadow p-6 mb-8" variants={itemVariants}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleViewPartialMembers}
                  className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium text-sm transition-colors"
                >
                  View Outstanding Balances
                </button>
                <button
                  onClick={handleViewUnpaidMembers}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                >
                  View Unpaid Members
                </button>
              </div>
            </div>
            <PaymentChart paidCount={paidCount} unpaidCount={unpaidCount} partialCount={partialCount} />
          </motion.div>

          {/* Analytics Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Members</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalActiveMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.pendingPaymentsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">New Admissions</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.newAdmissionsMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.expiringMemberships}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Pending Members */}
          {pendingMembers && pendingMembers.length > 0 && (
            <motion.div className="bg-white rounded-lg shadow p-6" variants={itemVariants}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Members with Pending Payments</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Member Name</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMembers.map((member: any) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{member.name}</td>
                        <td className="py-2 px-4">{member.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Expiring Memberships */}
          {expiringMembers && expiringMembers.length > 0 && (
            <motion.div className="bg-white rounded-lg shadow p-6" variants={itemVariants}>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Members with Expiring Memberships (Next 7 Days)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Member Name</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Phone</th>
                      <th className="text-left py-2 px-4 font-medium text-gray-700">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expiringMembers.map((member: any) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-4">{member.name}</td>
                        <td className="py-2 px-4">{member.phone}</td>
                        <td className="py-2 px-4">{formatDate(member.end_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Leads Section Card */}
          {showAssignedLeads && (
            <motion.div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-500" variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">📞 Your Leads</h3>
                <div className="flex gap-2">
                  <button
                    onClick={fetchLeads}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                    title="Refresh leads"
                  >
                    🔄
                  </button>
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
                  >
                    + Add Lead
                  </button>
                  <button
                    onClick={() => setShowAssignedLeads(false)}
                    className="text-gray-500 hover:text-gray-700 text-lg font-bold"
                    title="Minimize"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {leadsLoading ? (
                <div className="flex justify-center items-center min-h-[200px]">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : leads && leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-purple-50">
                      <tr>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Lead Name</th>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Phone</th>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Status</th>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Interest</th>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-purple-900">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads
                        .filter((lead: any) => lead.status === 'new')
                        .map((lead: any) => (
                          <tr key={lead.id} className="border-b hover:bg-gray-50 transition-colors">
                            <td className="py-3 px-4 font-medium">{lead.name}</td>
                            <td className="py-3 px-4">{lead.phone}</td>
                            <td className="py-3 px-4 capitalize">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lead.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                lead.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                                  lead.status === 'interested' ? 'bg-green-100 text-green-800' :
                                    lead.status === 'converted' ? 'bg-emerald-100 text-emerald-800' :
                                      lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${lead.interest_level === 'hot' ? 'bg-red-100 text-red-800' :
                                lead.interest_level === 'warm' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}>
                                {lead.interest_level?.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">{formatDate(lead.created_at)}</td>
                            <td className="py-3 px-4">
                              <select
                                value={lead.status}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                className="px-2 py-1 border border-purple-300 rounded text-xs bg-white cursor-pointer hover:border-purple-500"
                              >
                                <option value="new">New</option>
                                <option value="contacted">Called</option>
                                <option value="interested">Interested</option>
                                <option value="converted">Converted</option>
                                <option value="lost">Lost</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {leads.filter((lead: any) => lead.status === 'new').length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-lg">No new leads found.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg">No leads yet. Click the button to add one!</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Utilities Section Card */}
          <motion.div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-orange-500" variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">⚙️ Utilities & Expenses</h3>
              <button
                onClick={() => setShowAddUtilityModal(true)}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                + Record Utility
              </button>
            </div>
            {expensesLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-semibold text-orange-900">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-orange-900">Category</th>
                      <th className="text-left py-3 px-4 font-semibold text-orange-900">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-orange-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.map((expense: any) => (
                      <tr key={expense.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 font-medium">{expense.description}</td>
                        <td className="py-3 px-4"><span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-semibold capitalize">{expense.category}</span></td>
                        <td className="py-3 px-4 font-semibold text-red-600">-{formatCurrency(expense.amount)}</td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(expense.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No utilities recorded yet. Click the button to add one!</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Members View */}
      {activeTab === 'members' && (
        <motion.div
          key="members-view"
          variants={itemVariants}
          initial="hidden"
          animate="visible"
        >
          <MemberManagement initialFilter={memberFilter} />
        </motion.div>
      )}
    </motion.div>
  );
}
