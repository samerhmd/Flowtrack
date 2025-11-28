export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getTodayOverview } from '@/lib/db/today'
import CaffeineQuickLog from '@/components/logging/CaffeineQuickLog'
import WaterQuickLog from '@/components/logging/WaterQuickLog'
import { cookies } from 'next/headers'

export default async function TodayPage() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Today</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Sign in to view your today overview.</p>
        <div>
          <Link href="/login">
            <Button variant="primary">Sign In</Button>
          </Link>
        </div>
      </div>
    )
  }

  const overview = await getTodayOverview(supabase)

  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Today</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Your flow inputs and deep-work sessions for {overview.date}.</p>
      </div>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Snapshot</h2>
        {overview.physio ? (
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="dark:text-gray-300">Energy: <span className="font-medium dark:text-gray-200">{overview.physio.energy ?? '–'}</span></div>
              <div className="dark:text-gray-300">Mood: <span className="font-medium dark:text-gray-200">{overview.physio.mood ?? '–'}</span></div>
              <div className="dark:text-gray-300">Focus: <span className="font-medium dark:text-gray-200">{overview.physio.focus_clarity ?? '–'}</span></div>
              <div className="dark:text-gray-300">Stress: <span className="font-medium dark:text-gray-200">{overview.physio.stress ?? '–'}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="dark:text-gray-300">Sleep hours: <span className="font-medium dark:text-gray-200">{overview.physio.sleep_hours ?? '–'}</span></div>
              <div className="dark:text-gray-300">Sleep quality: <span className="font-medium dark:text-gray-200">{overview.physio.sleep_quality ?? '–'}</span></div>
            </div>
            <div className="dark:text-gray-300">Caffeine total: <span className="font-medium dark:text-gray-200">{overview.physio.caffeine_total_mg ?? '–'} mg</span></div>
            {overview.physio.day_tags && overview.physio.day_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {overview.physio.day_tags.map((t) => (
                  <span key={t} className="px-2 py-1 text-xs rounded-md border dark:border-gray-700 dark:text-gray-200">{t}</span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <p className="text-gray-600 dark:text-gray-300">No daily snapshot yet.</p>
            <Link href="/physio/new">
              <Button variant="primary" size="sm">Log today’s physio</Button>
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
          <h3 className="text-md font-semibold mb-2 dark:text-gray-200">Caffeine</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Total: {overview.caffeine.total_mg} mg</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Last dose: {overview.caffeine.last_event_time ? new Date(overview.caffeine.last_event_time).toLocaleTimeString() : 'none yet'}</p>
        </div>
        <div className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
          <h3 className="text-md font-semibold mb-2 dark:text-gray-200">Water</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">Total: {overview.water.total_ml} ml</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold mb-2 dark:text-gray-200">Quick log</h2>
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
          Capture today&apos;s inputs as you go. Each caffeine dose and glass of water becomes an event for your long-term insights.
        </p>
        <div className="grid gap-3 md:grid-cols-2">
          <CaffeineQuickLog />
          <WaterQuickLog />
        </div>
      </section>

      <section className="border rounded-lg p-4 bg-white shadow-sm dark:bg-black dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-3 dark:text-gray-200">Today’s Sessions</h2>
        {overview.sessions.length > 0 ? (
          <div className="space-y-2">
            {overview.sessions.map(s => (
              <div key={s.id} className="flex justify-between text-sm">
                <span className="dark:text-gray-300">{new Date(s.start_time).toLocaleTimeString()} – {new Date(s.end_time).toLocaleTimeString()}</span>
                <span className="dark:text-gray-200">{Math.round(s.duration_seconds/60)} min · Flow {s.flow_rating ?? '–'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-300">No sessions logged yet.</p>
        )}
        <div className="mt-3">
          <Link href="/sessions/new">
            <Button variant="primary" size="sm">Start new session</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
