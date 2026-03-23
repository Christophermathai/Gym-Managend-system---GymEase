'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  profile: {
    id: string;
    userId: string;
    role: 'owner' | 'trainer';
    name: string;
    phone?: string;
    isActive: boolean;
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createProfile: (name: string, role: 'owner' | 'trainer', phone?: string) => Promise<void>;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Load user on mount using the HttpOnly cookie automatically sent by the browser
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/users/current-user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setToken('http-only-cookie-active');
        } else {
          setToken(null);
          setUser(null);
        }
      } catch (error) {
        console.error('Failed to check session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, flow: 'signIn' }),
    });

    if (!response.ok) {
      throw new Error('Sign in failed');
    }

    setToken('http-only-cookie-active');
    const userRes = await fetch('/api/users/current-user');
    if (userRes.ok) {
      setUser(await userRes.json());
    }
  };

  const signUp = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, flow: 'signUp' }),
    });

    if (!response.ok) {
      throw new Error('Sign up failed');
    }

    setToken('http-only-cookie-active');
    const userRes = await fetch('/api/users/current-user');
    if (userRes.ok) {
      setUser(await userRes.json());
    }
  };

  const signOut = async () => {
    await fetch('/api/auth/sign-out', { method: 'POST' });
    setToken(null);
    setUser(null);
  };

  const createProfile = async (name: string, role: 'owner' | 'trainer', phone?: string) => {
    const response = await fetch('/api/users/current-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, role, phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to create profile');
    }

    // Reload user
    const userResponse = await fetch('/api/users/current-user');

    if (userResponse.ok) {
      const userData = await userResponse.json();
      setUser(userData);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        createProfile,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
