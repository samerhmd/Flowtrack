export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import GarminImportView from '@/components/import/GarminImportView'
import { cookies } from 'next/headers'

export default async function ImportPage() {
  const cookieStore = await cookies()
  const supabase = createSupabaseServerClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto mt-8">
        <h1 className="text-2xl font-semibold dark:text-gray-200">Import Garmin CSV (Tier 0)</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">Please sign in to import CSV data.</p>
        <div>
          <Link href="/login" className="text-blue-600">Go to login →</Link>
        </div>
      </div>
    )
  }
  return (
    <div className="space-y-6 max-w-3xl mx-auto mt-8">
      <h1 className="text-2xl font-semibold dark:text-gray-200">Import Garmin CSV (Tier 0)</h1>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Upload Sleep, HRV Status, Heart Rate, and Activities CSVs exported from Garmin. Data will be normalized into daily rows and saved.
      </p>
      <GarminImportView />
    </div>
  )
}
