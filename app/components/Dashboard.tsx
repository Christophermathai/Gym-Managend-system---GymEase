'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
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
  LogOut, PlusCircle, ChevronLeft, ChevronRight
} from 'lucide-react';
import { GymSettings } from './GymSettings';
import LottieLoader from './LottieLoader';

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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gym_ease_sidebar_collapsed') === 'true';
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('gym_ease_sidebar_collapsed', String(next));
      return next;
    });
  };

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
        <AnimatePresence>
          <LottieLoader size={130} />
        </AnimatePresence>
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
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-obsidian-600 bg-obsidian-900 shrink-0 transition-all duration-300 overflow-hidden ${isSidebarCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`p-6 pb-2 transition-all duration-300 ${isSidebarCollapsed ? 'px-4' : 'px-6'}`}>
          <div className={`flex mb-8 gap-3 items-center ${isSidebarCollapsed ? 'flex-col justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded bg-electric-500 flex items-center justify-center text-white font-bold text-xl select-none shrink-0" title="PARALLAX_CORE">
                G
              </div>
              <div className={`transition-all duration-300 flex flex-col justify-center whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'opacity-0 w-0 h-0 pointer-events-none' : 'opacity-100 w-auto'}`}>
                <h1 className="text-industrial-50 font-bold text-lg tracking-tight uppercase">Gym Ease</h1>
                <p className="text-xs text-obsidian-600 uppercase">{userRole} TERMINAL</p>
              </div>
            </div>
            
            {/* Collapse/Expand Toggle Button */}
            <button
              onClick={toggleSidebar}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-1.5 text-obsidian-500 hover:text-industrial-300 hover:bg-obsidian-800 rounded transition-colors shrink-0"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {userRole === 'owner' && (
            <div className="space-y-2 mb-8 overflow-hidden">
              <button
                onClick={() => setShowAddMemberModal(true)}
                title={isSidebarCollapsed ? "Add Member" : ""}
                className={`w-full flex items-center px-3 py-2 bg-electric-500 hover:bg-electric-600 text-white rounded text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}`}>Add Member</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                title={isSidebarCollapsed ? "Record Payment" : ""}
                className={`w-full flex items-center px-3 py-2 border border-obsidian-600 hover:border-electric-500 text-industrial-50 hover:text-electric-500 rounded text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              >
                <Wallet className="w-4 h-4 shrink-0" />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}`}>Record Payment</span>
              </button>
            </div>
          )}
        </div>

        <nav className={`flex-1 overflow-y-auto space-y-1 pb-4 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : 'px-4'}`}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                title={isSidebarCollapsed ? item.label : ""}
                className={`w-full flex items-center py-2.5 rounded text-sm font-medium transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3'} ${isActive
                  ? 'bg-obsidian-800 text-industrial-50 shadow-sm border border-obsidian-600/50'
                  : 'text-industrial-400 hover:text-industrial-50 hover:bg-obsidian-800/50'
                  }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-electric-500' : ''}`} />
                <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3'}`}>
                  {item.label}
                </span>
              </button>
            )
          })}
        </nav>

        <div className={`p-4 border-t border-obsidian-600 transition-all duration-300 ${isSidebarCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center gap-3 mb-4 transition-all duration-300 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-2'}`}>
            <div className="w-8 h-8 rounded-full bg-obsidian-800 border border-obsidian-600 flex items-center justify-center text-xs text-industrial-50 font-bold shrink-0">
              {user.profile.name.charAt(0)}
            </div>
            <div className={`transition-all duration-300 flex flex-col justify-center whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto flex-1'}`}>
              <div className="text-sm font-bold text-industrial-50 truncate">{user.profile.name}</div>
              <div className="text-xs text-industrial-400 truncate">{user.email}</div>
            </div>
          </div>
          <button
            onClick={signOut}
            title={isSidebarCollapsed ? "Sign Out" : ""}
            className={`w-full flex items-center py-2 text-sm font-medium text-industrial-400 hover:text-red-400 hover:bg-obsidian-800/50 rounded transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3'}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className={`transition-all duration-300 whitespace-nowrap overflow-hidden ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-2'}`}>Sign Out</span>
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
              <AddUtilityModal isOpen={showAddUtilityModal} onClose={() => setShowAddUtilityModal(false)} onSuccess={() => { triggerRefresh(); setShowAddUtilityModal(false); }} />
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
