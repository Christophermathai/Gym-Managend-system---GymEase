'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useModals } from './ModalContext';
import { OwnerDashboard } from './OwnerDashboard';
import { TrainerDashboard } from './TrainerDashboard';
import { MemberManagement } from './MemberManagement';
import { FeePlanManagement } from './FeePlanManagement';
import { ExpenseManagement } from './ExpenseManagement';
import { LeadManagement } from './LeadManagement';
import { StaffManagement } from './StaffManagement';
import { PaymentView } from './PaymentView';
import { AddMemberModal } from './AddMemberModal';
import { RecordPaymentModal } from './RecordPaymentModal';
import { AddLeadModal } from './AddLeadModal';
import { AddUtilityModal } from './AddUtilityModal';
import { Footer } from './Footer';

export function Dashboard() {
  const { user } = useAuth();
  const {
    showAddMemberModal, setShowAddMemberModal,
    showPaymentModal, setShowPaymentModal,
    showAddLeadModal, setShowAddLeadModal,
    showAddUtilityModal, setShowAddUtilityModal,
  } = useModals();
  const [activeTab, setActiveTab] = useState('overview');
  const [memberFilter, setMemberFilter] = useState<'unpaid' | null>(null);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']));
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewUnpaidMembers = () => {
    setMemberFilter('unpaid');
    setVisitedTabs(prev => new Set(prev).add('members'));
    setActiveTab('members');
  };

  // Reset filter when switching tabs manually
  const handleTabChange = (tab: string) => {
    if (tab !== 'members') setMemberFilter(null);
    setVisitedTabs(prev => new Set(prev).add(tab));
    setActiveTab(tab);
  };

  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!user || !user.profile) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userRole = user.profile.role;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.profile.name}!
        </h1>
        <p className="text-gray-600">
          {userRole === 'owner' ? 'Owner Dashboard - Full Access' : 'Trainer Dashboard - Operational Access'}
        </p>
      </div>

      {userRole === 'owner' ? (
        <>
          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap space-x-2 md:space-x-6">
              <TabButton
                label="Overview"
                active={activeTab === 'overview'}
                onClick={() => handleTabChange('overview')}
              />
              <TabButton
                label="Members"
                active={activeTab === 'members'}
                onClick={() => handleTabChange('members')}
              />
              <TabButton
                label="Fee Plans"
                active={activeTab === 'plans'}
                onClick={() => handleTabChange('plans')}
              />
              <TabButton
                label="Expenses"
                active={activeTab === 'expenses'}
                onClick={() => handleTabChange('expenses')}
              />
              <TabButton
                label="Leads"
                active={activeTab === 'leads'}
                onClick={() => handleTabChange('leads')}
              />
              <TabButton
                label="Staff"
                active={activeTab === 'staff'}
                onClick={() => handleTabChange('staff')}
              />
              <TabButton
                label="Payments"
                active={activeTab === 'payments'}
                onClick={() => handleTabChange('payments')}
              />
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium border-b-2 border-transparent hover:border-blue-600"
              >
                + Add Member
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 text-green-600 hover:text-green-800 font-medium border-b-2 border-transparent hover:border-green-600"
              >
                + Record Payment
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
              <OwnerDashboard key={`overview-${refreshKey}`} onViewUnpaidMembers={handleViewUnpaidMembers} />
            </div>

            <div className={activeTab === 'members' ? 'block' : 'hidden'}>
              {(activeTab === 'members' || visitedTabs.has('members')) && (
                <MemberManagement key={`members-${refreshKey}`} initialFilter={memberFilter} />
              )}
            </div>

            <div className={activeTab === 'plans' ? 'block' : 'hidden'}>
              {(activeTab === 'plans' || visitedTabs.has('plans')) && <FeePlanManagement />}
            </div>

            <div className={activeTab === 'expenses' ? 'block' : 'hidden'}>
              {(activeTab === 'expenses' || visitedTabs.has('expenses')) && <ExpenseManagement />}
            </div>

            <div className={activeTab === 'leads' ? 'block' : 'hidden'}>
              {(activeTab === 'leads' || visitedTabs.has('leads')) && <LeadManagement />}
            </div>

            <div className={activeTab === 'staff' ? 'block' : 'hidden'}>
              {(activeTab === 'staff' || visitedTabs.has('staff')) && <StaffManagement />}
            </div>

            <div className={activeTab === 'payments' ? 'block' : 'hidden'}>
              {(activeTab === 'payments' || visitedTabs.has('payments')) && <PaymentView />}
            </div>
          </div>

          {/* Modals */}
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onSuccess={() => {
              triggerRefresh();
              if (activeTab !== 'members') {
                // Only switch if not already there, but refresh happens regardless due to key change
                // Actually key change only happens if we pass refreshKey to child.
                // We passed refreshKey to MemberManagement, so it will re-mount.
              }
            }}
          />
          <RecordPaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => {
              triggerRefresh();
              setActiveTab('overview');
            }}
          />
          <AddLeadModal
            isOpen={showAddLeadModal}
            onClose={() => setShowAddLeadModal(false)}
            onSuccess={() => {
              triggerRefresh();
              setActiveTab('overview');
            }}
          />
          <AddUtilityModal
            isOpen={showAddUtilityModal}
            onClose={() => setShowAddUtilityModal(false)}
            onSuccess={() => {
              triggerRefresh();
              setShowAddUtilityModal(false);
              setActiveTab('expenses');
            }}
          />
        </>
      ) : (
        <>
          <TrainerDashboard />
          {/* Modals for Trainer */}
          <AddMemberModal
            isOpen={showAddMemberModal}
            onClose={() => setShowAddMemberModal(false)}
            onSuccess={() => { }}
          />
          <RecordPaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onSuccess={() => { }}
          />
          <AddLeadModal
            isOpen={showAddLeadModal}
            onClose={() => setShowAddLeadModal(false)}
            onSuccess={() => { }}
          />
          <AddUtilityModal
            isOpen={showAddUtilityModal}
            onClose={() => setShowAddUtilityModal(false)}
            onSuccess={() => { }}
          />
        </>
      )}

      <Footer />
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`py-2 px-4 border-b-2 font-medium transition-colors ${active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
    >
      {label}
    </button>
  );
}
