'use client';

import { useAuth } from './AuthContext';

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
    >
      Sign Out
    </button>
  );
}
