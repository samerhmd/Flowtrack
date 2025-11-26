export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

export default async function PhysioHistoryPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto mt-8">
        <h1 className="text-xl font-semibold dark:text-gray-200">Physio History</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in.</p>
      </div>
    );
  }

  const { data } = await supabase
    .from('physio_logs')
    .select('date,energy,mood,focus_clarity,stress,context')
    .order('date', { ascending: false })
    .limit(90);

  const rows = data || [];

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
              <div className="text-xs text-gray-600 dark:text-gray-300">E {r.energy} · M {r.mood} · F {r.focus_clarity} · S {r.stress} {r.context ? `· ${r.context}` : ''}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
