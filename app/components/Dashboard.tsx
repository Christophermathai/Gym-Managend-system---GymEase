'use client';

import { useState } from 'react';
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
import { BulkMemberImport } from './BulkMemberImport';
import { Reports } from './Reports';
import {
  Wallet, Settings, LayoutDashboard, Users, CreditCard, Receipt,
  Target, ShieldCheck, UploadCloud, BarChart3,
  LogOut, PlusCircle
} from 'lucide-react';
import { GymSettings } from './GymSettings';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const {
    showAddMemberModal, setShowAddMemberModal,
    showPaymentModal, setShowPaymentModal,
    showAddLeadModal, setShowAddLeadModal,
    showAddUtilityModal, setShowAddUtilityModal,
  } = useModals();
  const [activeTab, setActiveTab] = useState('overview');
  const [memberFilter, setMemberFilter] = useState<'unpaid' | 'partial' | null>(null);
  const [visitedTabs, setVisitedTabs] = useState<Set<string>>(new Set(['overview']));
  const [refreshKey, setRefreshKey] = useState(0);

  const handleViewUnpaidMembers = () => {
    setMemberFilter('unpaid');
    setVisitedTabs(prev => new Set(prev).add('members'));
    setActiveTab('members');
  };

  const handleViewPartialMembers = () => {
    setMemberFilter('partial');
    setVisitedTabs(prev => new Set(prev).add('members'));
    setActiveTab('members');
  };

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
      <div className="flex justify-center items-center h-screen bg-obsidian-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-500"></div>
      </div>
    );
  }

  const userRole = user.profile.role;

  const NAV_ITEMS = userRole === 'owner' ? [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'plans', label: 'Fee Plans', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'leads', label: 'Leads', icon: Target },
    { id: 'staff', label: 'Staff', icon: ShieldCheck },
    { id: 'import', label: 'Import', icon: UploadCloud },
    { id: 'payments', label: 'Payments', icon: Wallet },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] : [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users }
  ];

  return (
    <div className="flex h-screen bg-obsidian-900 text-industrial-300 overflow-hidden font-sans selection:bg-electric-500 selection:text-white">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-obsidian-600 bg-obsidian-900 shrink-0">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded bg-electric-500 flex items-center justify-center text-white font-bold text-xl">
              G
            </div>
            <div>
              <h1 className="text-industrial-50 font-bold text-lg tracking-tight uppercase">Gym Ease</h1>
              <p className="text-xs text-obsidian-600">{userRole.toUpperCase()} TERMINAL</p>
            </div>
          </div>

          {userRole === 'owner' && (
            <div className="space-y-2 mb-8">
              <button
                onClick={() => setShowAddMemberModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded text-sm font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> Add Member
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full flex items-center gap-2 px-3 py-2 border border-obsidian-600 hover:border-electric-500 text-industrial-50 hover:text-electric-500 rounded text-sm font-medium transition-colors"
              >
                <Wallet className="w-4 h-4" /> Record Payment
              </button>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-1 pb-4">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${isActive
                  ? 'bg-obsidian-800 text-industrial-50 shadow-sm border border-obsidian-600/50'
                  : 'text-industrial-400 hover:text-industrial-50 hover:bg-obsidian-800/50'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-electric-500' : ''}`} />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-obsidian-600">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-obsidian-800 border border-obsidian-600 flex items-center justify-center text-xs text-industrial-50 font-bold">
              {user.profile.name.charAt(0)}
            </div>
            <div className="flex-1 truncate">
              <div className="text-sm font-bold text-industrial-50 truncate">{user.profile.name}</div>
              <div className="text-xs text-industrial-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-industrial-400 hover:text-red-400 hover:bg-obsidian-800/50 rounded transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full h-16 border-b border-obsidian-600 bg-obsidian-900/90 backdrop-blur z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-electric-500 text-white flex items-center justify-center font-bold text-xs">G</div>
          <span className="font-bold text-industrial-50">Gym Ease</span>
        </div>
        {userRole === 'owner' && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddMemberModal(true)} className="p-2 text-electric-500 bg-electric-500/10 rounded">
              <PlusCircle className="w-5 h-5" />
            </button>
            <button onClick={() => setShowPaymentModal(true)} className="p-2 text-industrial-300 hover:text-industrial-50">
              <Wallet className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-obsidian-900 md:bg-transparent pt-16 md:pt-0 pb-20 md:pb-0">
        <div className="max-w-7xl mx-auto p-4 md:p-8 h-full">
          {userRole === 'owner' ? (
            <>
              <div className={activeTab === 'overview' ? 'block' : 'hidden'}>
                <OwnerDashboard key={`overview-${refreshKey}`} onViewUnpaidMembers={handleViewUnpaidMembers} onViewPartialMembers={handleViewPartialMembers} />
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
              <div className={activeTab === 'import' ? 'block' : 'hidden'}>
                {(activeTab === 'import' || visitedTabs.has('import')) && <BulkMemberImport />}
              </div>
              <div className={activeTab === 'payments' ? 'block' : 'hidden'}>
                {(activeTab === 'payments' || visitedTabs.has('payments')) && <PaymentView />}
              </div>
              <div className={activeTab === 'reports' ? 'block' : 'hidden'}>
                {(activeTab === 'reports' || visitedTabs.has('reports')) && <Reports />}
              </div>
              <div className={activeTab === 'settings' ? 'block' : 'hidden'}>
                {(activeTab === 'settings' || visitedTabs.has('settings')) && <GymSettings />}
              </div>

              {/* Modals */}
              <AddMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} onSuccess={triggerRefresh} />
              <RecordPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSuccess={() => { triggerRefresh(); setActiveTab('overview'); }} />
              <AddLeadModal isOpen={showAddLeadModal} onClose={() => setShowAddLeadModal(false)} onSuccess={() => { triggerRefresh(); setActiveTab('overview'); }} />
              <AddUtilityModal isOpen={showAddUtilityModal} onClose={() => setShowAddUtilityModal(false)} onSuccess={() => { triggerRefresh(); setShowAddUtilityModal(false); setActiveTab('expenses'); }} />
            </>
          ) : (
            <>
              {activeTab === 'overview' && <TrainerDashboard key={`overview-trainer-${refreshKey}`} />}
              {activeTab === 'members' && <MemberManagement key={`members-trainer-${refreshKey}`} initialFilter={memberFilter} />}

              <AddMemberModal isOpen={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} onSuccess={triggerRefresh} />
              <RecordPaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onSuccess={triggerRefresh} />
              <AddLeadModal isOpen={showAddLeadModal} onClose={() => setShowAddLeadModal(false)} onSuccess={triggerRefresh} />
              <AddUtilityModal isOpen={showAddUtilityModal} onClose={() => setShowAddUtilityModal(false)} onSuccess={() => { triggerRefresh(); setActiveTab('expenses'); }} />
            </>
          )}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full h-16 bg-obsidian-900 border-t border-obsidian-600 z-40 flex overflow-x-auto no-scrollbar">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-20 shrink-0 gap-1 ${isActive ? 'text-electric-500' : 'text-industrial-400'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  );
}
