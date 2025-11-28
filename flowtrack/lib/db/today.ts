import { SupabaseClient } from '@supabase/supabase-js'

export interface TodayOverview {
  date: string
  physio: {
    energy: number | null
    mood: number | null
    focus_clarity: number | null
    stress: number | null
    sleep_hours: number | null
    sleep_quality: number | null
    caffeine_total_mg: number | null
    day_tags: string[] | null
  } | null
  caffeine: {
    total_mg: number
    last_event_time: string | null
  }
  water: {
    total_ml: number
  }
  sessions: {
    id: string
    start_time: string
    end_time: string
    duration_seconds: number
    activity: string | null
    flow_rating: number | null
  }[]
}

export async function getTodayOverview(supabase: SupabaseClient): Promise<TodayOverview> {
  const todayString = new Date().toISOString().slice(0, 10)

  const { data: physioRow, error: physioErr } = await supabase
    .from('physio_logs')
    .select('energy, mood, focus_clarity, stress, sleep_hours, sleep_quality, caffeine_total_mg, day_tags')
    .eq('date', todayString)
    .maybeSingle()
  if (physioErr) throw physioErr

  const { data: caffeineEvents, error: cafErr } = await supabase
    .from('caffeine_events')
    .select('event_time, mg')
    .eq('date', todayString)
    .order('event_time', { ascending: true })
  if (cafErr) throw cafErr

  const cafTotal = (caffeineEvents || []).reduce((sum: number, e: any) => sum + (e.mg || 0), 0)
  const cafLast = (caffeineEvents && caffeineEvents.length > 0) ? caffeineEvents[caffeineEvents.length - 1].event_time : null

  const { data: waterEvents, error: waterErr } = await supabase
    .from('water_events')
    .select('ml')
    .eq('date', todayString)
  if (waterErr) throw waterErr

  const waterTotal = (waterEvents || []).reduce((sum: number, e: any) => sum + (e.ml || 0), 0)

  const { data: sessionRows, error: sessErr } = await supabase
    .from('sessions')
    .select('id, start_time, end_time, duration_seconds, activity, flow_rating')
    .eq('date', todayString)
    .order('start_time', { ascending: true })
  if (sessErr) throw sessErr

  return {
    date: todayString,
    physio: physioRow ? {
      energy: physioRow.energy ?? null,
      mood: physioRow.mood ?? null,
      focus_clarity: physioRow.focus_clarity ?? null,
      stress: physioRow.stress ?? null,
      sleep_hours: physioRow.sleep_hours ?? null,
      sleep_quality: physioRow.sleep_quality ?? null,
      caffeine_total_mg: physioRow.caffeine_total_mg ?? null,
      day_tags: physioRow.day_tags ?? null,
    } : null,
    caffeine: {
      total_mg: cafTotal,
      last_event_time: cafLast,
    },
    water: {
      total_ml: waterTotal,
    },
    sessions: (sessionRows || []).map((s: any) => ({
      id: s.id,
      start_time: s.start_time,
      end_time: s.end_time,
      duration_seconds: s.duration_seconds,
      activity: s.activity ?? null,
      flow_rating: s.flow_rating ?? null,
    })),
  }
}
