'use client';

import SessionWizard from '@/components/sessions/SessionWizard';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';

export default function NewSessionPage() {
  const router = useRouter();
  const [hasSaved, setHasSaved] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setNeedsAuth(true);
        router.push('/login');
      }
    });
  }, []);

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-semibold dark:text-gray-200">New Session</h1>
      <p className="text-sm text-gray-600 dark:text-gray-100">
        Start a focused work block, then rate your flow when you&apos;re done.
      </p>

      {!hasSaved ? (
        <SessionWizard
          onSuccess={() => {
            setHasSaved(true);
            router.push('/sessions');
          }}
        />
      ) : (
        <p className="text-sm text-green-600 dark:text-green-500">
          Session saved. Redirecting...
        </p>
      )}
    </div>
  );
}
