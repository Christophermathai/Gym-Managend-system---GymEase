'use client';

import { useAuth } from './AuthContext';
import { useState } from 'react';
import { toast } from 'sonner';

export function SignInForm() {
  const { signIn, signUp } = useAuth();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData(e.currentTarget);
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;

      if (flow === 'signIn') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (error) {
      let toastTitle = '';
      if (error instanceof Error) {
        if (error.message.includes('Invalid password')) {
          toastTitle = 'Invalid password. Please try again.';
        } else {
          toastTitle =
            flow === 'signIn'
              ? 'Could not sign in, did you mean to sign up?'
              : 'Could not sign up, did you mean to sign in?';
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
          {flow === 'signIn' ? 'Sign in' : 'Sign up'}
        </button>
      </form>
      <div className="mt-4 text-center">
        <button
          onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
          className="text-blue-600 hover:underline text-sm"
        >
          {flow === 'signIn'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
