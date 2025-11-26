'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignInInline() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const router = useRouter();

  const normalizeEmail = (value: string) => {
    const trimmed = value.trim();
    const parts = trimmed.split('@');
    if (parts.length !== 2) return trimmed;
    const local = parts[0];
    const domain = parts[1].replace(/,/g, '.');
    return `${local}@${domain}`;
  };

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSignIn = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter a password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (err) throw err;
      router.replace('/dashboard');
      router.refresh();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError('Enter a valid email address');
      return;
    }
    if (!password) {
      setError('Enter a password');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: err } = await supabase.auth.signUp({ email: normalized, password });
      if (err) throw err;
      // Try immediate sign-in (works when email confirm is disabled)
      const { error: signErr } = await supabase.auth.signInWithPassword({ email: normalized, password });
      if (signErr) throw signErr;
      router.replace('/dashboard');
      router.refresh();
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3 max-w-md mx-auto">
      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSignIn}
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing in…' : 'Sign In'}
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          disabled={loading}
          className="flex-1 border border-gray-300 py-2 px-4 rounded-md hover:bg-gray-50"
        >
          {loading ? 'Creating…' : 'Create Account'}
        </button>
      </div>
    </div>
  );
}
