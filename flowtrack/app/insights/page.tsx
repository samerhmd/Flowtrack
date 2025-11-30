export const dynamic = 'force-dynamic';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

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

import InsightsView from '@/components/insights/InsightsView';
import { getDailyInsightsData } from '@/lib/db/insights';

export default async function InsightsPage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  let user: any = null;
  const canGetUser = typeof (supabase as any)?.auth?.getUser === 'function';
  if (canGetUser) {
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {}
  }
  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Insights</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to view insights.</p>
        <div>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  let rows: Awaited<ReturnType<typeof getDailyInsightsData>> = [];
  try {
    rows = await getDailyInsightsData(supabase, 90);
  } catch {
    rows = [];
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold dark:text-gray-200">Insights</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        How sleep, caffeine, environment and time-of-day correlate with flow (last ~60 days).
      </p>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <InsightsView data={rows} />
      </section>
    </div>
  );
}
