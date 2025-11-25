'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

export default function SignInInline() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const normalizeEmail = (value: string) => {
    const trimmed = value.trim();
    const parts = trimmed.split('@');
    if (parts.length !== 2) return trimmed;
    const local = parts[0];
    const domain = parts[1].replace(/,/g, '.');
    return `${local}@${domain}`;
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSend = async () => {
    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError('Enter a valid email address');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error: err } = await supabase.auth.signInWithOtp({ email: normalized, options: { emailRedirectTo: redirectTo } });
      if (err) throw err;
      setSent(true);
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to send sign-in link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {!sent ? (
        <div className="space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleSend}
            disabled={loading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending…' : 'Send Sign-In Link'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-green-600 text-center">Check your email for the sign-in link.</p>
      )}
    </div>
  );
}
