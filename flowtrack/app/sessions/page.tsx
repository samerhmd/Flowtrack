"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import SessionCard from '@/components/sessions/SessionCard';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getSessions } from '@/lib/db/sessions';

export default function SessionsPage() {
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const load = async () => {
      const { data: sessionRes } = await supabase.auth.getSession();
      if (!sessionRes.session) {
        setNeedsAuth(true);
        setLoading(false);
        return;
      }
      const rows = await getSessions(supabase, { limit: 50 });
      setSessions(rows);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto mt-8">
        <h1 className="text-xl font-semibold dark:text-gray-200">Sessions</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto mt-8">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold dark:text-gray-200">Sessions</h1>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to view your sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto mt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-semibold dark:text-gray-200">Sessions</h1>
        <Link href="/sessions/new">
          <Button variant="primary">Start new session</Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            No sessions yet — start your first deep work block.
          </p>
          <Link href="/sessions/new">
            <Button variant="primary">Start Session</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
