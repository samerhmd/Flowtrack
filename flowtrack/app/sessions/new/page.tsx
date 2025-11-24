'use client';

import SessionWizard from '@/components/sessions/SessionWizard';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export default function NewSessionPage() {
  const router = useRouter();
  const [hasSaved, setHasSaved] = useState(false);

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-semibold">New Session</h1>
      <p className="text-sm text-gray-600">
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
        <p className="text-sm text-green-600">
          Session saved. Redirecting...
        </p>
      )}
    </div>
  );
}