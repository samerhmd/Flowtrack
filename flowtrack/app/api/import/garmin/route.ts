import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { buildGarminDailySnapshots } from '@/lib/import/garmin'
import { upsertExternalDailySnapshot } from '@/lib/db/external'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }

    const form = await req.formData()
    const sleep = form.get('sleep') as File | null
    const hrv = form.get('hrv') as File | null
    const heartRate = form.get('heartRate') as File | null
    const activities = form.get('activities') as File | null

    const files = {
      sleepCsv: sleep ? await sleep.text() : undefined,
      hrvCsv: hrv ? await hrv.text() : undefined,
      heartRateCsv: heartRate ? await heartRate.text() : undefined,
      activitiesCsv: activities ? await activities.text() : undefined,
    }

    const snapshots = buildGarminDailySnapshots(files)
    if (process.env.NODE_ENV !== 'production') {
      const sampleDates = snapshots.slice(0, 10).map(s => s.date)
      console.log('[garmin import] daysProcessed(candidate):', snapshots.length, 'sampleDates:', sampleDates)
    }
    let count = 0
    for (const s of snapshots) {
      const rawPayload: Record<string, unknown> = {
        provider: 'garmin_csv',
        sleep_duration_min: s.sleep_duration_min ?? null,
        sleep_score: s.sleep_score ?? null,
        hrv_ms: s.hrv_ms ?? null,
        resting_hr_bpm: s.resting_hr_bpm ?? null,
        training_minutes: s.training_minutes ?? null,
      }
      await upsertExternalDailySnapshot(supabase, {
        provider: 'garmin',
        date: s.date,
        user_id: session.user?.id,
        sleep_hours: s.sleep_duration_min != null ? s.sleep_duration_min / 60 : null,
        sleep_quality: s.sleep_score ?? null,
        hrv_score: s.hrv_ms ?? null,
        resting_hr: s.resting_hr_bpm ?? null,
        raw_payload: rawPayload,
      })
      count += 1
    }

    return new Response(JSON.stringify({ ok: true, daysProcessed: count, snapshots: snapshots.slice(0, 50) }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    console.error('Garmin import failed', e)
    return new Response(JSON.stringify({ error: 'Failed to import Garmin CSV', details: String(e?.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
export const runtime = 'nodejs'
