// Utility types and interfaces for Gym Ease

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  role: 'owner' | 'trainer';
  name: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface FeePlan {
  id: string;
  name: string;
  description?: string;
  duration: 1 | 3 | 6 | 12;
  monthlyFee: number;
  admissionFee?: number;
  registrationFee?: number;
  securityDeposit?: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface Member {
  id: string;
  memberId: string;
  name: string;
  email?: string;
  phone: string;
  secondaryPhone?: string;
  dateOfBirth?: number;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  bloodGroup?: string;
  medicalNotes?: string;
  admissionDate: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  subscription?: Subscription;
}

export interface Subscription {
  id: string;
  memberId: string;
  feePlanId: string;
  startDate: number;
  endDate: number;
  status: 'active' | 'expired' | 'cancelled';
  createdBy: string;
  createdAt: string;
  planName?: string;
  duration?: number;
  monthlyFee?: number;
}

export interface Payment {
  id: string;
  memberId: string;
  subscriptionId?: string;
  amount: number;
  paymentType: 'membership' | 'admission' | 'registration' | 'personal_training' | 'other';
  paymentMode: 'cash' | 'card' | 'upi' | 'bank_transfer' | 'cheque';
  transactionId?: string;
  paymentDate: number;
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
  recordedBy: string;
  createdAt: string;
  memberName?: string;
  memberId_display?: string;
}

export interface Expense {
  id: string;
  category: 'rent' | 'utilities' | 'equipment' | 'salaries' | 'marketing' | 'miscellaneous';
  description: string;
  amount: number;
  expenseDate: number;
  paymentMode: 'cash' | 'card' | 'bank_transfer' | 'cheque';
  receiptNumber?: string;
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: string;
  timestamp: number;
}

export interface DashboardOverview {
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
  newAdmissionsMonth: number;
  expiringMemberships: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  recentPayments: Payment[];
  expiringMembers: Member[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
