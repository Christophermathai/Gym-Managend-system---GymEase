'use client';

import { useAuth } from './AuthContext';
import { SignInForm } from './SignInForm';
import { SignOutButton } from './SignOutButton';
import { Toaster } from 'sonner';
import { Dashboard } from './Dashboard';
import { ProfileSetup } from './ProfileSetup';
import { ModalProvider } from './ModalContext';
import { WelcomeSetup } from './WelcomeSetup';
import { useState, useEffect } from 'react';
import { Footer } from './Footer';
import LottieLoader from './LottieLoader';
import { AnimatePresence } from 'framer-motion';

export function App() {
  const { user, loading } = useAuth();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if initial setup is needed
    const checkSetup = async () => {
      console.log("%c[PARALLAX_MACHINE]%c SYSTEM_CORE_SYNC_ESTABLISHED // ARCH: v4.1.2", "color: #0066FF; font-weight: bold", "color: gray");
      try {
        const response = await fetch('/api/check-setup');
        const data = await response.json();
        setNeedsSetup(data.needsSetup);
      } catch (error) {
        console.error('Error checking setup:', error);
        setNeedsSetup(false);
      }
    };

    checkSetup();
  }, []);

  if (loading || needsSetup === null) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-obsidian-900">
        <AnimatePresence>
          <LottieLoader size={130} key="app-loader" />
        </AnimatePresence>
      </div>
    );
  }

  // Show welcome setup if database is empty
  if (needsSetup) {
    return (
      <>
        <WelcomeSetup />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-900 font-sans selection:bg-electric-500 selection:text-white">
      <header className="sticky top-0 z-10 bg-obsidian-900/90 backdrop-blur-md h-16 flex justify-between items-center border-b border-obsidian-600 shadow-sm px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-electric-500 flex items-center justify-center text-white font-bold text-xl cursor-help select-none" title="PARALLAX_CORE_v4.1.2">
            G
          </div>
          <h2 className="text-lg font-bold text-industrial-50 uppercase tracking-widest cursor-default select-none" title="SYSTEM_ARCH: HYPER- INDUSTRIAL_v4">Gym Ease</h2>
        </div>
        {user && <SignOutButton />}
      </header>
      <main className="flex-1 flex flex-col relative text-industrial-300">
        {!user ? (
          <div className="flex items-center justify-center flex-1 p-8">
            <div className="w-full max-w-sm mx-auto bg-obsidian-800 border border-obsidian-600 p-8 rounded shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-12 h-12 bg-electric-500 rounded mx-auto mb-6 flex items-center justify-center text-white text-2xl font-bold">G</div>
                <h1 className="text-xl font-bold text-industrial-50 mb-2 uppercase tracking-widest">Gym Ease</h1>
                <p className="text-[10px] text-industrial-400 uppercase tracking-widest font-mono">Terminal Access</p>
              </div>
              <SignInForm />
            </div>
          </div>
        ) : user.profile ? (
          <ModalProvider>
            <Dashboard />
          </ModalProvider>
        ) : (
          <ProfileSetup />
        )}
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
