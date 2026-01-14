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

  // Initialize token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  // Load user when token is available
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/users/current-user', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const signIn = async (email: string, password: string) => {
    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, flow: 'signIn' }),
    });

    if (!response.ok) {
      throw new Error('Sign in failed');
    }

    const { token: newToken } = await response.json();
    localStorage.setItem('authToken', newToken);
    setToken(newToken);
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

    localStorage.setItem('authToken', newToken);
    const { token: newToken } = await response.json();
    setToken(newToken);
  };

  const signOut = async () => {
    localStorage.removeItem('authToken');
    await fetch('/api/auth/sign-out', { method: 'POST' });
    setToken(null);
    setUser(null);
  };

  const createProfile = async (name: string, role: 'owner' | 'trainer', phone?: string) => {
    const response = await fetch('/api/users/current-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ name, role, phone }),
    });

    if (!response.ok) {
      throw new Error('Failed to create profile');
    }

    // Reload user
    const userResponse = await fetch('/api/users/current-user', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

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
