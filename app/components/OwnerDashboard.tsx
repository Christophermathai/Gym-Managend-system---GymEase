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
}

export function OwnerDashboard({ onViewUnpaidMembers }: OwnerDashboardProps) {
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
  const unpaidCount = Math.max(0, overview.totalActiveMembers - paidCount);

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
          className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          <span>+</span> Add Member
        </button>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          <span>+</span> Record Payment
        </button>
      </motion.div>

      <motion.div className="grid grid-cols-1 lg:grid-cols-3 gap-6" variants={itemVariants}>
        {/* Payment Chart Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6 h-full transition-shadow hover:shadow-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Status Overview</h3>
              {onViewUnpaidMembers && (
                <button
                  onClick={onViewUnpaidMembers}
                  className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 font-medium text-sm transition-colors"
                >
                  View Unpaid Members
                </button>
              )}
            </div>
            <PaymentChart paidCount={paidCount} unpaidCount={unpaidCount} />
          </div>
        </div>

        {/* Key Stats Cards */}
        <div className="space-y-6">
          <motion.div className="bg-white rounded-lg shadow p-9 transition-transform hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalActiveMembers}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white rounded-lg shadow p-9 transition-transform hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                <p className="text-2xl font-bold text-gray-900">{overview.pendingPaymentsCount}</p>
                <p className="text-sm text-gray-500">{formatCurrency(overview.pendingPaymentsAmount)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div className="bg-white rounded-lg shadow p-9 transition-transform hover:-translate-y-1 hover:shadow-md" variants={itemVariants}>
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Net Profit (Month)</p>
                <p className={`text-2xl font-bold ${overview.netProfitMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(overview.netProfitMonth)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Revenue & Stats Grid */}
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={itemVariants}>
        <div className="bg-white rounded-lg shadow p-6 transition-transform hover:-translate-y-1 hover:shadow-md">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Month Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview.monthRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 transition-transform hover:-translate-y-1 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Revenue</h3>
          <p className="text-3xl font-bold text-green-600">{formatCurrency(overview.todayRevenue)}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 transition-transform hover:-translate-y-1 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">New Admissions</h3>
          <p className="text-3xl font-bold text-blue-600">{overview.newAdmissionsMonth}</p>
          <p className="text-sm text-gray-500">This Month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 transition-transform hover:-translate-y-1 hover:shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Expiring Soon</h3>
          <p className="text-3xl font-bold text-orange-600">{overview.expiringMemberships}</p>
          <p className="text-sm text-gray-500">Next 7 days</p>
        </div>
      </motion.div>

      {/* Tables Grid */}
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6" variants={itemVariants}>
        {/* Recent Payments */}
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Payments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Member</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-2 px-4 font-medium text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0, 5).map((payment: any, index: number) => (
                  <motion.tr
                    key={payment.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-2 px-4">{payment.member_name || 'Unknown'}</td>
                    <td className="py-2 px-4">{formatCurrency(payment.amount)}</td>
                    <td className="py-2 px-4">{payment.payment_type}</td>
                    <td className="py-2 px-4">{formatDate(payment.payment_date)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expiring Memberships */}
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Members with Expiring Memberships</h3>
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
                {expiringMembers.slice(0, 5).map((member: any, index: number) => (
                  <motion.tr
                    key={member.id}
                    className="border-b hover:bg-gray-50 cursor-pointer"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <td className="py-2 px-4">{member.name}</td>
                    <td className="py-2 px-4">{member.phone}</td>
                    <td className="py-2 px-4">{formatDate(member.end_date)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
