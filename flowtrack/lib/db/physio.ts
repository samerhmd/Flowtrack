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
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  resting_hr?: number | null;
  hrv_score?: number | null;
  caffeine_total_mg?: number | null;
  caffeine_last_intake_time?: string | null;
  bed_time?: string | null;
  wake_time?: string | null;
  day_tags?: string[] | null;
  day_notes?: string | null;
}

export interface PhysioLogInput {
  date: string;
  energy: number;
  mood: number;
  focus_clarity: number;
  stress: number;
  context?: string;
  user_id?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  resting_hr?: number;
  hrv_score?: number;
  caffeine_total_mg?: number;
  caffeine_last_intake_time?: string;
  bed_time?: string;
  wake_time?: string;
  day_tags?: string[];
  day_notes?: string;
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

export interface PhysioLogListOptions {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface PhysioLogUpdateInput {
  energy?: number;
  mood?: number;
  focus_clarity?: number;
  stress?: number;
  context?: string;
  sleep_hours?: number;
  sleep_quality?: number;
  resting_hr?: number;
  hrv_score?: number;
  caffeine_total_mg?: number;
  caffeine_last_intake_time?: string;
  bed_time?: string;
  wake_time?: string;
  day_tags?: string[];
  day_notes?: string;
}

export async function getPhysioLogsRange(
  supabase: SupabaseClient,
  options: PhysioLogListOptions = {}
): Promise<PhysioLog[]> {
  try {
    let query = supabase
      .from('physio_logs')
      .select('*')
      .order('date', { ascending: false });

    if (options.startDate) {
      query = query.gte('date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('date', options.endDate);
    }
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching physio logs range:', error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error('Error in getPhysioLogsRange:', error);
    throw error;
  }
}

export async function updatePhysioLogForDate(
  supabase: SupabaseClient,
  date: string,
  updates: PhysioLogUpdateInput
): Promise<PhysioLog> {
  try {
    const { data, error } = await supabase
      .from('physio_logs')
      .update(updates)
      .eq('date', date)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating physio log:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updatePhysioLogForDate:', error);
    throw error;
  }
}
