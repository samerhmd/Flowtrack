export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getSessions } from '@/lib/db/sessions';
import Link from 'next/link';
import SessionCard from '@/components/sessions/SessionCard';
import { Button } from '@/components/ui/Button';

export default async function SessionsPage() {
  const supabase = createSupabaseServerClient();
  const sessions = await getSessions(supabase, { limit: 50 });

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
