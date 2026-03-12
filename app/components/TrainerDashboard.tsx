'use client';

import { motion, Variants, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModals } from './ModalContext';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { MemberManagement } from './MemberManagement';
import { PaymentChart } from './charts/PaymentChart';
import LottieLoader from './LottieLoader';

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
      <div className="fixed inset-0 bg-obsidian-900 flex items-center justify-center z-[60]">
        <AnimatePresence>
          <LottieLoader size={130} key="trainer-main-loader" />
        </AnimatePresence>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] text-industrial-400 bg-obsidian-800 border border-obsidian-600 rounded-lg p-6">
        <p className="mb-4 font-mono uppercase tracking-widest text-xs">[ FAILED TO LOAD DASHBOARD DATA ]</p>
        <button
          onClick={() => {
            setLoading(true); // Reset loading state
            fetchDashboardData();
            fetchLeads();
            fetchExpenses();
          }}
          className="px-6 py-2 bg-electric-500 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-electric-600 transition-colors shadow-[0_0_15px_rgba(0,102,255,0.3)]"
        >
          RETRY
        </button>
      </div>
    );
  }

  const { overview, expiringMembers, recentLeads } = data;
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
      <div className="border-b border-obsidian-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('dashboard')}
            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors ${activeTab === 'dashboard'
              ? 'border-electric-500 text-electric-500'
              : 'border-transparent text-industrial-500 hover:text-industrial-300 hover:border-obsidian-600'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => handleTabChange('members')}
            className={`py-4 px-1 border-b-2 font-bold text-xs uppercase tracking-widest transition-colors ${activeTab === 'members'
              ? 'border-electric-500 text-electric-500'
              : 'border-transparent text-industrial-500 hover:text-industrial-300 hover:border-obsidian-600'
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
          {/* Quick Action Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" variants={itemVariants}>
            <button
              onClick={() => setShowAddMemberModal(true)}
              className="bg-obsidian-800 border border-obsidian-600 hover:border-electric-500 hover:bg-obsidian-700 rounded-lg p-6 text-center transition-all group group-hover:shadow-[0_0_15px_rgba(0,102,255,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-industrial-600 group-hover:bg-electric-500 transition-colors" />
              <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">👤</div>
              <p className="font-bold text-industrial-50 uppercase tracking-widest text-[10px]">Add Member</p>
              <p className="text-[10px] text-industrial-400 mt-1 uppercase tracking-wider font-mono">Register new</p>
            </button>

            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-obsidian-800 border border-obsidian-600 hover:border-green-500 hover:bg-obsidian-700 rounded-lg p-6 text-center transition-all group group-hover:shadow-[0_0_15px_rgba(34,197,94,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-industrial-600 group-hover:bg-green-500 transition-colors" />
              <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">💳</div>
              <p className="font-bold text-industrial-50 uppercase tracking-widest text-[10px]">Record Fee</p>
              <p className="text-[10px] text-industrial-400 mt-1 uppercase tracking-wider font-mono">Track payments</p>
            </button>

            <button
              onClick={() => setShowAddLeadModal(true)}
              className="bg-obsidian-800 border border-obsidian-600 hover:border-purple-500 hover:bg-obsidian-700 rounded-lg p-6 text-center transition-all group group-hover:shadow-[0_0_15px_rgba(168,85,247,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-industrial-600 group-hover:bg-purple-500 transition-colors" />
              <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">📞</div>
              <p className="font-bold text-industrial-50 uppercase tracking-widest text-[10px]">Add Lead</p>
              <p className="text-[10px] text-industrial-400 mt-1 uppercase tracking-wider font-mono">New prospect</p>
            </button>

            <button
              onClick={() => setShowAddUtilityModal(true)}
              className="bg-obsidian-800 border border-obsidian-600 hover:border-orange-500 hover:bg-obsidian-700 rounded-lg p-6 text-center transition-all group group-hover:shadow-[0_0_15px_rgba(249,115,22,0.1)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-industrial-600 group-hover:bg-orange-500 transition-colors" />
              <div className="text-3xl mb-3 opacity-80 group-hover:opacity-100 transition-opacity">⚙️</div>
              <p className="font-bold text-industrial-50 uppercase tracking-widest text-[10px]">Record Utility</p>
              <p className="text-[10px] text-industrial-400 mt-1 uppercase tracking-wider font-mono">Track expenses</p>
            </button>
          </motion.div>

          {/* Payment Status Chart */}
          <motion.div className="bg-obsidian-800 border border-obsidian-600 rounded-lg p-6 mb-8 shadow-lg" variants={itemVariants}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-l-2 border-electric-500 pl-2">Payment Status</h3>
              <div className="flex gap-2">
                <button
                  onClick={handleViewPartialMembers}
                  className="px-4 py-2 bg-obsidian-700 text-orange-500 border border-orange-500/20 hover:border-orange-500 hover:bg-orange-500/10 rounded font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Balances
                </button>
                <button
                  onClick={handleViewUnpaidMembers}
                  className="px-4 py-2 bg-obsidian-700 text-red-500 border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 rounded font-bold uppercase tracking-wider text-[10px] transition-colors"
                >
                  Unpaid
                </button>
              </div>
            </div>
            <PaymentChart paidCount={paidCount} unpaidCount={unpaidCount} partialCount={partialCount} />
          </motion.div>

          {/* Analytics Cards */}
          {/* Analytics Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-electric-500" />
              <div className="flex items-center">
                <span className="p-3 bg-obsidian-700 border border-electric-500/30 rounded" title="PX_SEC_404">
                  <svg className="w-5 h-5 text-electric-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857" />
                  </svg>
                </span>
                <div className="ml-4">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Active Members</p>
                  <p className="text-2xl font-mono font-bold text-industrial-50">{overview.totalActiveMembers}</p>
                </div>
              </div>
            </div>

            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              <div className="flex items-center">
                <div className="p-3 bg-obsidian-700 border border-red-500/30 rounded">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-mono font-bold text-red-500">{overview.pendingPaymentsCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
              <div className="flex items-center">
                <div className="p-3 bg-obsidian-700 border border-green-500/30 rounded">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">New Admissions</p>
                  <p className="text-2xl font-mono font-bold text-green-500">{overview.newAdmissionsMonth}</p>
                </div>
              </div>
            </div>

            <div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />
              <div className="flex items-center">
                <div className="p-3 bg-obsidian-700 border border-orange-500/30 rounded">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Expiring Soon</p>
                  <p className="text-2xl font-mono font-bold text-orange-500">{overview.expiringMemberships}</p>
                </div>
              </div>
            </div>
          </motion.div>
          {expiringMembers && expiringMembers.length > 0 && (
            <motion.div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6" variants={itemVariants}>
              <h3 className="text-sm font-bold text-industrial-50 uppercase tracking-widest border-l-2 border-orange-500 pl-2 mb-6">Memberships Expiring (Next 7 Days)</h3>
              <div className="overflow-x-auto border border-obsidian-700 rounded">
                <table className="w-full text-sm">
                  <thead className="border-b border-obsidian-700 bg-obsidian-900">
                    <tr>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Member Name</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Phone</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Expiry Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-obsidian-700/50">
                    {expiringMembers.map((member: any) => (
                      <tr key={member.id} className="hover:bg-obsidian-700/30 transition-colors">
                        <td className="py-3 px-4 text-industrial-50 font-bold uppercase">{member.name}</td>
                        <td className="py-3 px-4 text-industrial-300 font-mono text-xs">{member.phone}</td>
                        <td className="py-3 px-4 text-orange-500 font-mono font-bold text-xs">{formatDate(member.end_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Leads Section Card */}
          {showAssignedLeads && (
            <motion.div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 border-l-4 border-l-purple-500" variants={itemVariants}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-industrial-50 uppercase tracking-widest pl-2">Your Leads</h3>
                <div className="flex gap-2">
                  <button
                    onClick={fetchLeads}
                    className="px-3 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 hover:border-industrial-500 hover:text-industrial-50 rounded text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center"
                    title="Refresh leads"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowAddLeadModal(true)}
                    className="px-4 py-2 bg-purple-600 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-purple-500 transition-colors shadow-[0_0_10px_rgba(147,51,234,0.3)]"
                  >
                    ADD LEAD
                  </button>
                  <button
                    onClick={() => setShowAssignedLeads(false)}
                    className="px-3 py-2 bg-obsidian-700 text-industrial-300 border border-obsidian-600 hover:border-red-500 hover:text-red-500 hover:bg-red-500/10 rounded font-bold transition-colors"
                    title="Minimize"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {leadsLoading && (
                  <div className="flex justify-center items-center min-h-[200px]">
                    <LottieLoader size={130} key="leads-loader" />
                  </div>
                )}
              </AnimatePresence>
              {!leadsLoading && leads && leads.length > 0 ? (
                <div className="overflow-x-auto border border-obsidian-700 rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-obsidian-900 border-b border-obsidian-700">
                      <tr>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Lead Name</th>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Phone</th>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Status</th>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Interest</th>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Date</th>
                        <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-obsidian-700/50">
                      {leads
                        .filter((lead: any) => lead.status === 'new')
                        .map((lead: any) => (
                          <tr key={lead.id} className="hover:bg-obsidian-700/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-industrial-50 uppercase">{lead.name}</td>
                            <td className="py-3 px-4 text-industrial-300 font-mono text-xs">{lead.phone}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border inline-block ${lead.status === 'new' ? 'bg-electric-500/10 border-electric-500/30 text-electric-500' :
                                lead.status === 'contacted' ? 'bg-steelgold-500/10 border-steelgold-500/30 text-steelgold-500' :
                                  lead.status === 'interested' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                    lead.status === 'converted' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' :
                                      lead.status === 'lost' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                        'bg-obsidian-700 border-obsidian-600 text-industrial-400'
                                }`}>
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border inline-block ${lead.interest_level === 'hot' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                lead.interest_level === 'warm' ? 'bg-steelgold-500/10 border-steelgold-500/30 text-steelgold-500' :
                                  'bg-electric-500/10 border-electric-500/30 text-electric-500'
                                }`}>
                                {lead.interest_level?.toUpperCase() || 'UNKNOWN'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-industrial-400 font-mono text-xs">{formatDate(lead.created_at)}</td>
                            <td className="py-3 px-4">
                              <select
                                value={lead.status}
                                onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                className="px-2 py-1 bg-obsidian-900 border border-obsidian-600 rounded text-xs font-bold text-industrial-50 uppercase tracking-wider cursor-pointer hover:border-electric-500 focus:outline-none transition-colors"
                              >
                                <option value="new">NEW</option>
                                <option value="contacted">CALLED</option>
                                <option value="interested">INTERESTED</option>
                                <option value="converted">CONVERTED</option>
                                <option value="lost">LOST</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {leads.filter((lead: any) => lead.status === 'new').length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest font-mono">[ NO NEW LEADS DETECTED ]</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 border border-obsidian-700 border-dashed rounded">
                  <p className="text-[10px] font-bold text-industrial-500 uppercase tracking-widest font-mono">[ SYSTEM: NO LEADS YET ]</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Utilities Section Card */}
          <motion.div className="bg-obsidian-800 border border-obsidian-600 rounded-lg shadow-lg p-6 border-l-4 border-l-orange-500" variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-industrial-50 uppercase tracking-widest pl-2">Utilities & Expenses</h3>
              <button
                onClick={() => setShowAddUtilityModal(true)}
                className="px-4 py-2 bg-orange-600 text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-orange-500 transition-colors shadow-[0_0_10px_rgba(249,115,22,0.3)]"
              >
                RECORD UTILITY
              </button>
            </div>
            {expensesLoading ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <LottieLoader size={130} />
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="overflow-x-auto border border-obsidian-700 rounded">
                <table className="w-full text-sm">
                  <thead className="bg-obsidian-900 border-b border-obsidian-700">
                    <tr>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Description</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Category</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Amount</th>
                      <th className="text-left py-3 px-4 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-obsidian-700/50">
                    {expenses.map((expense: any) => (
                      <tr key={expense.id} className="hover:bg-obsidian-700/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-industrial-50 uppercase">{expense.description}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-500">-{formatCurrency(expense.amount)}</td>
                        <td className="py-3 px-4 font-mono text-industrial-400 text-xs">{formatDate(expense.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-obsidian-700 border-dashed rounded">
                <p className="text-[10px] font-bold text-industrial-500 uppercase tracking-widest font-mono">[ SYSTEM: NO UTILITIES RECORDED YET ]</p>
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
