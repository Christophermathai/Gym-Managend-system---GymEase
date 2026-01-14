'use client';

import { AuthProvider } from './components/AuthContext';
import { App } from './components/App';

export default function Home() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
