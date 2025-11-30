import { SupabaseClient } from '@supabase/supabase-js'

export type ExternalProvider = 'garmin' | 'myfitnesspal'

export interface ExternalDailySnapshot {
  id: string
  user_id: string
  provider: ExternalProvider | string
  date: string
  sleep_hours: number | null
  sleep_quality: number | null
  resting_hr: number | null
  hrv_score: number | null
  steps: number | null
  calories_total: number | null
  calories_carbs: number | null
  calories_fat: number | null
  calories_protein: number | null
  raw_payload: unknown
  created_at: string
  updated_at: string
}

export interface UpsertExternalDailySnapshotInput {
  provider: ExternalProvider
  date: string
  user_id?: string
  sleep_hours?: number | null
  sleep_quality?: number | null
  resting_hr?: number | null
  hrv_score?: number | null
  steps?: number | null
  calories_total?: number | null
  calories_carbs?: number | null
  calories_fat?: number | null
  calories_protein?: number | null
  raw_payload?: unknown
}

export async function upsertExternalDailySnapshot(
  supabase: SupabaseClient,
  input: UpsertExternalDailySnapshotInput
): Promise<ExternalDailySnapshot> {
  const { data, error } = await supabase
    .from('external_daily_snapshots')
    .upsert(
      {
        provider: input.provider,
        date: input.date,
        user_id: input.user_id ?? undefined,
        sleep_hours: input.sleep_hours ?? null,
        sleep_quality: input.sleep_quality ?? null,
        resting_hr: input.resting_hr ?? null,
        hrv_score: input.hrv_score ?? null,
        steps: input.steps ?? null,
        calories_total: input.calories_total ?? null,
        calories_carbs: input.calories_carbs ?? null,
        calories_fat: input.calories_fat ?? null,
        calories_protein: input.calories_protein ?? null,
        raw_payload: input.raw_payload ?? null,
      },
      { onConflict: 'user_id,provider,date' }
    )
    .select('*')
    .single()

  if (error) {
    console.error('Error upserting external_daily_snapshot', error)
    throw error
  }

  return data as ExternalDailySnapshot
}
