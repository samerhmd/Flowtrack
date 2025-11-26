import { SupabaseClient } from '@supabase/supabase-js';

export interface PhysioLog {
  id: string;
  user_id: string;
  created_at: string;
  date: string;
  energy: number;
  mood: number;
  focus_clarity: number;
  stress: number;
  context?: string;
}

export interface PhysioLogInput {
  date: string;
  energy: number;
  mood: number;
  focus_clarity: number;
  stress: number;
  context?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  resting_hr?: number;
  hrv_score?: number;
  caffeine_total_mg?: number;
  caffeine_last_intake_time?: string;
  bed_time?: string;
  wake_time?: string;
}

export async function getPhysioLogForDate(supabase: SupabaseClient, date: string): Promise<PhysioLog | null> {
  try {
    const { data, error } = await supabase
      .from('physio_logs')
      .select('*')
      .eq('date', date)
      .maybeSingle();

    if (error) {
      console.error('Error fetching physio log:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getPhysioLogForDate:', error);
    throw error;
  }
}

export async function upsertPhysioLog(supabase: SupabaseClient, input: PhysioLogInput): Promise<PhysioLog> {
  try {
    const { data, error } = await supabase
      .from('physio_logs')
      .upsert(input, { onConflict: 'user_id,date' })
      .select('*')
      .single();

    if (error) {
      console.error('Error upserting physio log:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in upsertPhysioLog:', error);
    throw error;
  }
}
