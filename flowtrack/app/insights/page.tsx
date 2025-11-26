export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';

type SessionRow = {
  id: string;
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  activity?: string;
  flow_rating: number;
  notes?: string;
  environment?: string;
  noise?: string;
  session_type?: string;
};

type PhysioRow = {
  user_id: string;
  date: string;
  sleep_hours?: number;
  caffeine_total_mg?: number;
};

function bucketSleep(hours?: number): string {
  if (hours == null) return 'unknown';
  if (hours < 6) return '<6h';
  if (hours < 7) return '6–7h';
  if (hours < 8) return '7–8h';
  return '8+ h';
}

function bucketCaffeine(mg?: number): string {
  if (mg == null || mg <= 0) return '0 mg';
  if (mg <= 100) return '1–100 mg';
  if (mg <= 200) return '101–200 mg';
  return '200+ mg';
}

function bucketTimeOfDay(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'afternoon';
  return 'evening';
}

function aggregate<T extends string>(items: Array<{ key: T; rating: number }>) {
  const map = new Map<T, { sum: number; count: number }>();
  for (const { key, rating } of items) {
    const m = map.get(key) || { sum: 0, count: 0 };
    m.sum += rating;
    m.count += 1;
    map.set(key, m);
  }
  return Array.from(map.entries())
    .map(([bucket, { sum, count }]) => ({ bucket, avg: sum / count, count }))
    .sort((a, b) => b.avg - a.avg);
}

export default async function InsightsPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Insights</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to view insights.</p>
      </div>
    );
  }

  const { data: sessions } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: false })
    .limit(500);

  const { data: physios } = await supabase
    .from('physio_logs')
    .select('user_id,date,sleep_hours,caffeine_total_mg')
    .order('date', { ascending: false })
    .limit(500);

  const physioByDate = new Map<string, PhysioRow>();
  (physios || []).forEach(p => physioByDate.set(p.date, p));

  const sRows: SessionRow[] = (sessions || []) as any;

  const sleepAgg = aggregate(sRows.map(s => ({
    key: bucketSleep(physioByDate.get(s.date)?.sleep_hours),
    rating: s.flow_rating ?? 0,
  })));

  const cafAgg = aggregate(sRows.map(s => ({
    key: bucketCaffeine(physioByDate.get(s.date)?.caffeine_total_mg),
    rating: s.flow_rating ?? 0,
  })));

  const envAgg = aggregate(sRows.map(s => ({
    key: (s.environment || 'unknown') as string,
    rating: s.flow_rating ?? 0,
  })));

  const todAgg = aggregate(sRows.map(s => ({
    key: bucketTimeOfDay(s.start_time),
    rating: s.flow_rating ?? 0,
  })));

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold dark:text-gray-200">Insights</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Best → worst conditions by average flow rating (last ~500 sessions).
      </p>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Flow vs Sleep</h2>
        <div className="space-y-2">
          {sleepAgg.map(row => (
            <div key={row.bucket} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">{row.bucket}</span>
              <span className="dark:text-gray-200">{row.avg.toFixed(2)} / 10 ({row.count})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg:black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Flow vs Caffeine</h2>
        <div className="space-y-2">
          {cafAgg.map(row => (
            <div key={row.bucket} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">{row.bucket}</span>
              <span className="dark:text-gray-200">{row.avg.toFixed(2)} / 10 ({row.count})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Flow vs Environment</h2>
        <div className="space-y-2">
          {envAgg.map(row => (
            <div key={row.bucket} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">{row.bucket}</span>
              <span className="dark:text-gray-200">{row.avg.toFixed(2)} / 10 ({row.count})</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Flow vs Time of Day</h2>
        <div className="space-y-2">
          {todAgg.map(row => (
            <div key={row.bucket} className="flex justify-between text-sm">
              <span className="dark:text-gray-300">{row.bucket}</span>
              <span className="dark:text-gray-200">{row.avg.toFixed(2)} / 10 ({row.count})</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
