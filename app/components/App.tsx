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

export function App() {
  const { user, loading } = useAuth();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if initial setup is needed
    const checkSetup = async () => {
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
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <h2 className="text-xl font-semibold text-blue-600">Gym Ease</h2>
        {user && <SignOutButton />}
      </header>
      <main className="flex-1">
        {!user ? (
          <div className="flex items-center justify-center min-h-[500px] p-8">
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-600 mb-4">Gym Ease</h1>
                <p className="text-xl text-gray-600">Comprehensive Gym Management System</p>
                <p className="text-gray-500 mt-2">Sign in to manage your gym operations</p>
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
      <Toaster />
    </div>
  );
}
