import { createSupabaseServerClient } from '@/lib/supabaseServer';
import { getDashboardData } from '@/lib/db/dashboard';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const data = await getDashboardData(supabase);

  return (
    <div className="space-y-6 max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
        <Link href="/physio/new">
          <Button variant="primary">Log Physio</Button>
        </Link>
        <Link href="/sessions/new">
          <Button variant="primary">Start Session</Button>
        </Link>
      </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Today's Physio */}
        <section className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Today's Physio</h2>
          {data.todayPhysio ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Energy:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.energy}/10</span>
                </div>
                <div>
                  <span className="text-gray-600">Mood:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.mood}/10</span>
                </div>
                <div>
                  <span className="text-gray-600">Focus:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.focus_clarity}/10</span>
                </div>
                <div>
                  <span className="text-gray-600">Stress:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.stress}/10</span>
                </div>
              </div>
              {data.todayPhysio.context && (
                <div className="text-sm">
                  <span className="text-gray-600">Context:</span>
                  <span className="ml-2 font-medium">{data.todayPhysio.context}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">No physio logged today — log your first snapshot.</p>
              <Link href="/physio/new">
                <Button variant="primary" size="sm">Log Physio</Button>
              </Link>
            </div>
          )}
        </section>

        {/* Today's Sessions */}
        <section className="border rounded-lg p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold mb-3">Today's Sessions</h2>
          {data.todaySessions.length > 0 ? (
            <div className="space-y-2">
              <div className="text-sm">
                <span className="text-gray-600">Sessions:</span>
                <span className="ml-2 font-medium">{data.todaySessions.length}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-600">Avg Flow:</span>
                <span className="ml-2 font-medium">
                  {(data.todaySessions.reduce((sum, s) => sum + s.flow_rating, 0) / data.todaySessions.length).toFixed(1)}/10
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-2">No sessions today — start your first deep work block.</p>
              <Link href="/sessions/new">
                <Button variant="primary" size="sm">Start Session</Button>
              </Link>
            </div>
          )}
          <div className="mt-4">
            <Link href="/sessions" className="text-sm text-blue-600 hover:underline">
              View sessions →
            </Link>
          </div>
        </section>

        {/* Last 7 Days */}
        <section className="border rounded-lg p-4 bg-white shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold mb-3">Last 7 Days</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Sessions</div>
              <div className="text-2xl font-semibold">{data.last7Days.sessionCount}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Average Flow</div>
              <div className="text-2xl font-semibold">
                {data.last7Days.avgFlow ? `${data.last7Days.avgFlow.toFixed(1)}/10` : '–'}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/flow-recipe" className="text-sm text-blue-600 hover:underline">
              View flow recipe →
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}