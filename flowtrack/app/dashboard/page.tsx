"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabaseClient';
import { getDashboardData } from '@/lib/db/dashboard';
import CaffeineQuickLog from '@/components/logging/CaffeineQuickLog';
import WaterQuickLog from '@/components/logging/WaterQuickLog';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const load = async () => {
      try {
        const { data: sessionRes } = await supabase.auth.getSession();
        if (!sessionRes.session) {
          setNeedsAuth(true);
          setLoading(false);
          return;
        }
        try {
          const d = await getDashboardData(supabase);
          setData(d);
        } catch {
          setData(null);
        }
      } catch {
        setNeedsAuth(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading…</p>
      </div>
    );
  }

  if (needsAuth) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to view your data.</p>
        <div>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2 dark:text-gray-200">Quick actions</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          <Link href="/physio/new">
            <Button variant="primary">Log Physio</Button>
          </Link>
          <Link href="/sessions/new">
            <Button variant="primary">Start Session</Button>
          </Link>
          <Link href="/import">
            <Button variant="secondary">Import Garmin CSV</Button>
          </Link>
          <Link href="/today" prefetch={false} className="text-xs font-medium text-sky-500 hover:underline self-center">
            Go to Today view
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <CaffeineQuickLog />
          <WaterQuickLog />
        </div>
      </section>
      <h1 className="text-2xl font-semibold dark:text-gray-200">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Today's Physio</h2>
          {data?.todayPhysio ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Energy:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.energy}/10</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Mood:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.mood}/10</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Focus:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.focus_clarity}/10</span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-300">Stress:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.stress}/10</span>
                </div>
              </div>
              {data.todayPhysio.context && (
                <div className="text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Context:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.context}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-300">No physio logged today — log your first snapshot.</p>
              <div className="flex justify-center gap-3">
                <Link href="/physio/new">
                  <Button variant="primary" size="sm">Log Physio</Button>
                </Link>
                <Link href="/physio/history" className="text-sm text-blue-600 hover:underline self-center">View history →</Link>
              </div>
            </div>
          )}
        </section>

        <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Today's Sessions</h2>
          {data?.todaySessions?.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-300">Sessions:</span>
                <span className="ml-2 font-medium">{data.todaySessions.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600 dark:text-gray-300">Avg Flow:</span>
                <span className="ml-2 font-medium">
                  {(data.todaySessions.reduce((sum: number, s: any) => sum + s.flow_rating, 0) / data.todaySessions.length).toFixed(1)}/10
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">No sessions today — start your first deep work block.</p>
              <Link href="/sessions/new">
                <Button variant="primary" size="sm">Start Session</Button>
              </Link>
            </div>
          )}
          <div className="mt-4">
            <Link href="/sessions" prefetch={false} className="text-sm text-blue-600 hover:underline">
              View sessions →
            </Link>
          </div>
        </section>

        <section className="border rounded-lg p-4 bg-white shadow-sm md:col-span-2 dark:bg-black dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Last 7 Days</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
              <div className="text-2xl font-semibold dark:text-gray-200">{data?.last7Days?.sessionCount ?? 0}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Average Flow</div>
              <div className="text-2xl font-semibold dark:text-gray-200">
                {data?.last7Days?.avgFlow ? `${data.last7Days.avgFlow.toFixed(1)}/10` : '–'}
              </div>
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <Link href="/flow-recipe" prefetch={false} className="text-sm text-blue-600 hover:underline">
              View flow recipe →
            </Link>
            <Link href="/insights" prefetch={false} className="text-sm text-blue-600 hover:underline">
              View insights →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
