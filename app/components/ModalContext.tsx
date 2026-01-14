'use client';

import React, { createContext, useContext, useState } from 'react';

interface ModalContextType {
  showAddMemberModal: boolean;
  setShowAddMemberModal: (show: boolean) => void;
  showPaymentModal: boolean;
  setShowPaymentModal: (show: boolean) => void;
  showAddLeadModal: boolean;
  setShowAddLeadModal: (show: boolean) => void;
  showAddUtilityModal: boolean;
  setShowAddUtilityModal: (show: boolean) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [showAddUtilityModal, setShowAddUtilityModal] = useState(false);

  return (
    <ModalContext.Provider value={{
      showAddMemberModal,
      setShowAddMemberModal,
      showPaymentModal,
      setShowPaymentModal,
      showAddLeadModal,
      setShowAddLeadModal,
      showAddUtilityModal,
      setShowAddUtilityModal,
    }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModals() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModals must be used within ModalProvider');
  }
  return context;
}
