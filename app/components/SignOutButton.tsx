'use client';

import { useAuth } from './AuthContext';

export function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <button
      onClick={() => signOut()}
      className="px-4 py-2 text-industrial-400 hover:text-industrial-50 text-[10px] font-bold uppercase tracking-widest transition-colors bg-obsidian-800 hover:bg-obsidian-700 border border-obsidian-600 rounded flex items-center justify-center gap-2"
    >
      Sign Out
    </button>
  );
}
