'use client';

import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { useModals } from './ModalContext';
import { formatCurrency, formatDate } from '@/app/lib/utils';
import { PaymentChart } from './charts/PaymentChart';

interface Overview {
  totalActiveMembers: number;
  todayRevenue: number;
  monthRevenue: number;
  yearRevenue: number;
  monthExpenses: number;
  yearExpenses: number;
  netProfitMonth: number;
  netProfitYear: number;
  pendingPaymentsAmount: number;
  pendingPaymentsCount: number;
  paidMembersCount: number;
  partialMembersCount: number;
  newAdmissionsMonth: number;
  expiringMemberships: number;
}

interface DashboardData {
  overview: Overview;
  recentPayments: any[];
  expiringMembers: any[];
}

interface OwnerDashboardProps {
  onViewUnpaidMembers?: () => void;
  onViewPartialMembers?: () => void;
}

export function OwnerDashboard({ onViewUnpaidMembers, onViewPartialMembers }: OwnerDashboardProps) {
  const { token } = useAuth();
  const { setShowAddMemberModal, setShowPaymentModal } = useModals();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard/owner', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchData();
    }
  }, [token]);

  if (loading || !dashboardData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { overview, recentPayments, expiringMembers } = dashboardData;
  const paidCount = overview.paidMembersCount || 0;
  const partialCount = overview.partialMembersCount || 0;
  const unpaidCount = Math.max(0, overview.totalActiveMembers - paidCount - partialCount);

  return (
    <motion.div
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Quick Action Buttons */}
      <motion.div className="flex gap-4 flex-wrap" variants={itemVariants}>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="px-6 py-3 bg-electric-500 text-white rounded hover:bg-electric-600 font-medium flex items-center gap-2 transition-all shadow-lg text-sm uppercase tracking-wider"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Add Member
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-6 py-3 bg-obsidian-700 text-industrial-50 border border-obsidian-600 rounded hover:border-electric-500 font-medium flex items-center gap-2 transition-all shadow-lg text-sm uppercase tracking-wider"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          Record Payment
        </button>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={itemVariants}>
        {/* Payment Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 mb-6 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-obsidian-700">
              <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-wide">Payment Status Overview</h3>
              <div className="flex gap-2">
                {onViewPartialMembers && (
                  <button
                    onClick={onViewPartialMembers}
                    className="px-3 py-1.5 bg-steelgold-500/10 text-steelgold-500 border border-steelgold-500/30 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-steelgold-500/20 transition-colors"
                  >
                    View Balances
                  </button>
                )}
                {onViewUnpaidMembers && (
                  <button
                    onClick={onViewUnpaidMembers}
                    className="px-3 py-1.5 bg-red-500/10 text-red-500 border border-red-500/30 rounded text-[10px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors"
                  >
                    View Unpaid
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              <PaymentChart paidCount={paidCount} unpaidCount={unpaidCount} partialCount={partialCount} />
            </div>
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="flex flex-col gap-6 h-full">
          <motion.div className="flex-1 bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 relative overflow-hidden group flex items-center" variants={itemVariants}>
            <div className="absolute top-0 left-0 w-1 h-full bg-electric-500"></div>
            <div className="flex items-center w-full">
              <span className="p-4 bg-obsidian-900 border border-obsidian-700 rounded lg:p-5" title="PX_ENG_001">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-electric-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
              <div className="ml-5 lg:ml-6 flex-1">
                <p className="text-xs lg:text-sm font-bold text-industrial-400 uppercase tracking-widest mb-2">Active Members</p>
                <div className="flex flex-col">
                  <p className="text-3xl lg:text-4xl font-mono font-bold text-industrial-50">{overview.totalActiveMembers}</p>
                  <p className="text-[10px] lg:text-xs font-bold mt-2 uppercase tracking-wider">
                    <span className="text-green-500">{paidCount} Paid</span>
                    <span className="text-industrial-500 mx-2">•</span>
                    <span className="text-orange-500">{partialCount} Partial</span>
                    <span className="text-industrial-500 mx-2">•</span>
                    <span className="text-red-500">{unpaidCount} Unpaid</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="flex-1 bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 relative overflow-hidden group flex items-center" variants={itemVariants}>
            <div className="absolute top-0 left-0 w-1 h-full bg-steelgold-500"></div>
            <div className="flex items-center w-full">
              <div className="p-4 bg-obsidian-900 border border-obsidian-700 rounded lg:p-5">
                <svg className="w-6 h-6 lg:w-8 lg:h-8 text-steelgold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-5 lg:ml-6 flex-1">
                <p className="text-xs lg:text-sm font-bold text-industrial-400 uppercase tracking-widest mb-2">Pending Payments</p>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-3">
                    <p className="text-3xl lg:text-4xl font-mono font-bold text-industrial-50">
                      {overview.pendingPaymentsCount}
                    </p>
                    <p className="text-sm lg:text-base font-mono text-steelgold-500">{formatCurrency(overview.pendingPaymentsAmount)}</p>
                  </div>
                  <p className="text-[10px] lg:text-xs font-bold text-industrial-400 mt-2 uppercase tracking-wider">
                    Total Members With Overdue Balance
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div className="flex-1 bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 relative overflow-hidden group flex items-center" variants={itemVariants}>
            <div className={`absolute top-0 left-0 w-1 h-full ${overview.netProfitMonth >= 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex items-center w-full">
              <div className="p-4 bg-obsidian-900 border border-obsidian-700 rounded lg:p-5">
                <svg className={`w-6 h-6 lg:w-8 lg:h-8 ${overview.netProfitMonth >= 0 ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-5 lg:ml-6 flex-1">
                <p className="text-xs lg:text-sm font-bold text-industrial-400 uppercase tracking-widest mb-2">Net Profit (Month)</p>
                <div className="flex flex-col">
                  <p className={`text-3xl lg:text-4xl font-mono font-bold ${overview.netProfitMonth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatCurrency(overview.netProfitMonth)}
                  </p>
                  <div className="flex justify-between mt-2 text-[10px] lg:text-xs font-bold uppercase tracking-wider">
                    <span className="text-industrial-400">Rev: <span className="text-electric-500 font-mono">{formatCurrency(overview.monthRevenue)}</span></span>
                    <span className="text-industrial-400 ml-3">Exp: <span className="text-red-400 font-mono">{formatCurrency(overview.monthExpenses)}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Revenue & Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 group hover:border-electric-500/50 transition-colors">
          <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2">Month Revenue</h3>
          <p className="text-2xl font-mono font-bold text-electric-500">{formatCurrency(overview.monthRevenue)}</p>
        </div>

        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 group hover:border-electric-500/50 transition-colors">
          <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest mb-2">Today's Revenue</h3>
          <p className="text-2xl font-mono font-bold text-industrial-50">{formatCurrency(overview.todayRevenue)}</p>
        </div>

        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 group hover:border-electric-500/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">New Admissions</h3>
            <span className="text-[10px] uppercase font-bold text-obsidian-400">This Month</span>
          </div>
          <p className="text-2xl font-mono font-bold text-industrial-50">{overview.newAdmissionsMonth}</p>
        </div>

        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 group hover:border-steelgold-500/50 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-[10px] font-bold text-industrial-400 uppercase tracking-widest">Expiring Soon</h3>
            <span className="text-[10px] uppercase font-bold text-obsidian-400">Next 7 Days</span>
          </div>
          <p className="text-2xl font-mono font-bold text-steelgold-500">{overview.expiringMemberships}</p>
        </div>
      </motion.div>

      {/* Tables Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        {/* Recent Payments */}
        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 h-full flex flex-col">
          <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-wide mb-4 pb-2 border-b border-obsidian-700">Recent Payments</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="border-b border-obsidian-700">
                <tr>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest pl-2">Member</th>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Amount</th>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Type</th>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest pr-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-700/50">
                {recentPayments.slice(0, 5).map((payment: any, index: number) => (
                  <motion.tr
                    key={payment.id}
                    className="hover:bg-obsidian-700/30 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-3 px-2 text-industrial-50 font-medium">{payment.member_name || 'Unknown'}</td>
                    <td className="py-3 font-mono font-bold text-electric-500">{formatCurrency(payment.amount)}</td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 bg-obsidian-700 border border-obsidian-600 text-industrial-300 text-[10px] font-bold uppercase tracking-wider rounded-[2px] inline-block">
                        {payment.payment_type}
                      </span>
                    </td>
                    <td className="py-3 px-2 font-mono text-industrial-300 text-xs">{formatDate(payment.payment_date)}</td>
                  </motion.tr>
                ))}
                {recentPayments.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs font-mono text-industrial-400">
                      [ NO RECENT PAYMENTS ]
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Memberships */}
        <div className="bg-obsidian-800 border border-obsidian-600 rounded shadow-lg p-6 h-full flex flex-col">
          <h3 className="text-lg font-bold text-industrial-50 uppercase tracking-wide mb-4 pb-2 border-b border-obsidian-700">Expiring Memberships</h3>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="border-b border-obsidian-700">
                <tr>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest pl-2">Member Name</th>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest">Phone</th>
                  <th className="text-left py-3 font-bold text-[10px] text-industrial-400 uppercase tracking-widest pr-2">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-obsidian-700/50">
                {expiringMembers.slice(0, 5).map((member: any, index: number) => (
                  <motion.tr
                    key={member.id}
                    className="hover:bg-obsidian-700/30 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-3 px-2 text-industrial-50 font-medium">{member.name}</td>
                    <td className="py-3 font-mono text-industrial-300">{member.phone}</td>
                    <td className="py-3 px-2 font-mono text-steelgold-500 font-bold text-xs">{formatDate(member.end_date)}</td>
                  </motion.tr>
                ))}
                {expiringMembers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs font-mono text-industrial-400">
                      [ NO EXPIRING MEMBERSHIPS ]
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
