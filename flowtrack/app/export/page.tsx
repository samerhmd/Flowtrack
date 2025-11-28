export const dynamic = 'force-dynamic'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { cookies } from 'next/headers'
import { ExportView } from '@/components/export/ExportView'

export default async function ExportPage() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto mt-8">
        <h1 className="text-xl font-semibold dark:text-gray-200">Export data</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Sign in to export your FlowTrack data.</p>
        <a href="/login" className="inline-flex items-center rounded-md bg-sky-600 px-4 py-2 text-sm font-semibold text-white">Sign in</a>
      </div>
    )
  }

  const [physioRes, sessionsRes, caffeineRes, waterRes, externalRes] = await Promise.all([
    supabase.from('physio_logs').select('*').order('date', { ascending: true }),
    supabase.from('sessions').select('*').order('date', { ascending: true }).order('start_time', { ascending: true }),
    supabase.from('caffeine_events').select('*').order('event_time', { ascending: true }),
    supabase.from('water_events').select('*').order('event_time', { ascending: true }),
    supabase.from('external_daily_snapshots').select('*').order('date', { ascending: true }),
  ])

  const error = physioRes.error || sessionsRes.error || caffeineRes.error || waterRes.error || externalRes.error
  if (error) {
    console.error('Error loading export data', error)
    return (
      <div className="space-y-4 max-w-3xl mx-auto mt-8">
        <h1 className="text-xl font-semibold dark:text-gray-200">Export data</h1>
        <p className="text-sm text-rose-500">Failed to load export data. Check logs for details.</p>
      </div>
    )
  }

  const physio = physioRes.data ?? []
  const sessions = sessionsRes.data ?? []
  const caffeine = caffeineRes.data ?? []
  const water = waterRes.data ?? []
  const external = externalRes.data ?? []

  return (
    <div className="space-y-4 max-w-3xl mx-auto mt-8">
      <header>
        <h1 className="text-xl font-semibold dark:text-gray-200">Export data</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Download your FlowTrack data as CSV files for backup or analysis.</p>
      </header>

      <ExportView physio={physio} sessions={sessions} caffeine={caffeine} water={water} external={external} />
    </div>
  )
}
