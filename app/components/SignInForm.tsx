'use client';

import { useAuth } from './AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

export function SignInForm() {
  const { signIn } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      await signIn(email, password);
    } catch (error) {
      let toastTitle = 'Invalid email or password';
      if (error instanceof Error) {
        if (error.message.includes('Invalid password')) {
          toastTitle = 'Invalid password. Please try again.';
        } else if (error.message.includes('User not found')) {
          toastTitle = 'User not found. Please check your email.';
        }
      }
      toast.error(toastTitle);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          Sign in
        </button>
      </form>
    </div>
  );
}
