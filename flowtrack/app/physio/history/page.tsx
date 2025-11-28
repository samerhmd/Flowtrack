export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getPhysioLogsRange } from '@/lib/db/physio';
import { cookies } from 'next/headers';

export default async function PhysioHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto mt-8">
        <h1 className="text-xl font-semibold dark:text-gray-200">Physio History</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in.</p>
      </div>
    );
  }

  const rows = await getPhysioLogsRange(supabase, { limit: 90 });

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      <h1 className="text-xl font-semibold dark:text-gray-200">Physio History</h1>
      <div className="space-y-2">
        {rows.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">No entries yet.</p>
        ) : (
          rows.map((r) => (
            <div key={r.date} className="border rounded-lg p-3 bg-white dark:bg-black dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="dark:text-gray-300">{r.date}</span>
                <a href={`/physio/history/${r.date}`} className="text-blue-600">Edit</a>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">
                E {r.energy} · M {r.mood} · F {r.focus_clarity} · S {r.stress}
                {r.context ? ` · ${r.context}` : ''}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Sleep {r.sleep_hours ?? '–'} h · Caffeine {r.caffeine_total_mg ?? '–'} mg
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
