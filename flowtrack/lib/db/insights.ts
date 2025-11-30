import type { SupabaseClient } from '@supabase/supabase-js'

export interface DailyInsightRow {
  date: string
  avg_flow: number | null
  session_count: number
  sleep_hours: number | null
  sleep_quality: number | null
  caffeine_total_mg: number | null
  hrv_score: number | null
  resting_hr?: number | null
  training_minutes?: number | null
  merged_sleep_hours?: number | null
  merged_hrv_score?: number | null
  merged_resting_hr?: number | null
  has_partner_sleepover: boolean
  has_sick_tag: boolean
}

export async function getDailyInsightsData(
  supabase: SupabaseClient,
  days: number = 90
): Promise<DailyInsightRow[]> {
  const toDate = new Date()
  toDate.setHours(0, 0, 0, 0)
  const fromDate = new Date(toDate)
  fromDate.setDate(toDate.getDate() - (days - 1))

  const fromStr = fromDate.toISOString().slice(0, 10)
  const toStr = toDate.toISOString().slice(0, 10)

  const { data: sessions, error: sessErr } = await supabase
    .from('sessions')
    .select('date, flow_rating')
    .gte('date', fromStr)
    .order('date', { ascending: true })
  if (sessErr) throw sessErr

  const { data: physios, error: physErr } = await supabase
    .from('physio_logs')
    .select('date, sleep_hours, sleep_quality, caffeine_total_mg, hrv_score, day_tags')
    .gte('date', fromStr)
    .order('date', { ascending: true })
  if (physErr) throw physErr

  let externalRows: any[] | null = null
  try {
    const { data: ext, error: externalError } = await supabase
      .from('external_daily_snapshots')
      .select('date, provider, sleep_hours, sleep_quality, resting_hr, hrv_score, raw_payload')
      .gte('date', fromStr)
      .lte('date', toStr)
      .order('date', { ascending: true })
    if (externalError) {
      console.error('Error fetching external_daily_snapshots', externalError)
    }
    externalRows = ext || []
    if (process.env.NODE_ENV !== 'production') {
      const sampleDates = (externalRows || []).slice(0, 5).map(r => r?.date).filter(Boolean)
      console.log('[insights] external rows loaded:', externalRows.length, sampleDates)
    }
  } catch (e) {
    externalRows = []
  }

  const sessionsByDate = new Map<string, number[]>()
  for (const s of sessions || []) {
    const arr = sessionsByDate.get(s.date) || []
    arr.push(s.flow_rating ?? null)
    sessionsByDate.set(s.date, arr)
  }

  const physioByDate = new Map<string, any>()
  for (const p of physios || []) physioByDate.set(p.date, p)

  const externalByDate = new Map<string, any>()
  for (const row of externalRows || []) {
    const existing = externalByDate.get(row.date)
    if (!existing || String(row.provider).toLowerCase() === 'garmin') {
      externalByDate.set(row.date, row)
    }
  }

  const rows: DailyInsightRow[] = []
  for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    const flowRatings = sessionsByDate.get(dateStr) || []
    const session_count = flowRatings.length
    const avg_flow = session_count > 0
      ? flowRatings.reduce((a, b) => a + (b ?? 0), 0) / session_count
      : null

    const phys = physioByDate.get(dateStr)
    const sleep_hours = phys?.sleep_hours ?? null
    const sleep_quality = phys?.sleep_quality ?? null
    const caffeine_total_mg = phys?.caffeine_total_mg ?? null
    const hrv_score = phys?.hrv_score ?? null
    const tags = phys?.day_tags as string[] | null
    const hasPartner = Array.isArray(tags) && tags.includes('partner_sleepover')
    const hasSick = Array.isArray(tags) && tags.includes('sick')

    let row: DailyInsightRow = {
      date: dateStr,
      avg_flow,
      session_count,
      sleep_hours,
      sleep_quality,
      caffeine_total_mg,
      hrv_score,
      resting_hr: null,
      training_minutes: null,
      merged_sleep_hours: null,
      merged_hrv_score: null,
      merged_resting_hr: null,
      has_partner_sleepover: !!hasPartner,
      has_sick_tag: !!hasSick,
    }

    const ext = externalByDate.get(dateStr)
    if (ext) {
      const extSleep = ext.sleep_hours != null ? Number(ext.sleep_hours) : null
      const extSleepQuality = ext.sleep_quality != null ? Number(ext.sleep_quality) : null
      const extRest = ext.resting_hr != null ? Number(ext.resting_hr) : null
      const extHrv = ext.hrv_score != null ? Number(ext.hrv_score) : null
      row.sleep_hours = row.sleep_hours != null && !Number.isNaN(row.sleep_hours as number)
        ? row.sleep_hours
        : (extSleep ?? row.sleep_hours ?? null)
      row.sleep_quality = row.sleep_quality != null && !Number.isNaN(row.sleep_quality as number)
        ? row.sleep_quality
        : (extSleepQuality ?? row.sleep_quality ?? null)
      row.resting_hr = extRest ?? row.resting_hr ?? null
      row.hrv_score = row.hrv_score != null && !Number.isNaN(row.hrv_score as number)
        ? row.hrv_score
        : (extHrv ?? row.hrv_score ?? null)
      const tm = (ext as any)?.training_minutes ?? (ext as any)?.raw_payload?.training_minutes ?? null
      row.training_minutes = tm ?? row.training_minutes ?? null
    }

    // Build merged fields used by UI (physio first, then external fallback)
    const mergedExtSleep = ext?.sleep_hours != null ? Number(ext.sleep_hours) : null
    row.merged_sleep_hours = row.sleep_hours != null && !Number.isNaN(row.sleep_hours as number)
      ? row.sleep_hours
      : mergedExtSleep
    row.merged_hrv_score = row.hrv_score != null && !Number.isNaN(row.hrv_score)
      ? row.hrv_score
      : (ext?.hrv_score ?? null)
    row.merged_resting_hr = row.resting_hr != null && !Number.isNaN(row.resting_hr as number)
      ? row.resting_hr
      : (ext?.resting_hr ?? null)

    rows.push(row)
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
