import type { SupabaseClient } from '@supabase/supabase-js'

export interface DailyInsightRow {
  date: string
  avg_flow: number | null
  session_count: number
  sleep_hours: number | null
  sleep_quality: number | null
  caffeine_total_mg: number | null
  hrv_score: number | null
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

  const sessionsByDate = new Map<string, number[]>()
  for (const s of sessions || []) {
    const arr = sessionsByDate.get(s.date) || []
    arr.push(s.flow_rating ?? null)
    sessionsByDate.set(s.date, arr)
  }

  const physioByDate = new Map<string, any>()
  for (const p of physios || []) physioByDate.set(p.date, p)

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

    rows.push({
      date: dateStr,
      avg_flow,
      session_count,
      sleep_hours,
      sleep_quality,
      caffeine_total_mg,
      hrv_score,
      has_partner_sleepover: !!hasPartner,
      has_sick_tag: !!hasSick,
    })
  }

  return rows.sort((a, b) => a.date.localeCompare(b.date))
}
