import { SupabaseClient } from '@supabase/supabase-js';

export interface WaterEvent {
  id: string;
  user_id: string;
  created_at: string;
  event_time: string;
  date: string;
  ml: number;
  source?: string | null;
}

export interface WaterEventInput {
  event_time?: string;
  ml: number;
  source?: string;
}

export async function createWaterEvent(
  supabase: SupabaseClient,
  input: WaterEventInput
): Promise<WaterEvent> {
  const payload: any = {
    ml: input.ml,
    source: input.source ?? null,
  };
  if (input.event_time) {
    payload.event_time = input.event_time;
    payload.date = new Date(input.event_time).toISOString().slice(0, 10);
  }
  const { data, error } = await supabase
    .from('water_events')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as WaterEvent;
}

export async function getWaterEventsForDate(
  supabase: SupabaseClient,
  date: string
): Promise<WaterEvent[]> {
  const { data, error } = await supabase
    .from('water_events')
    .select('*')
    .eq('date', date)
    .order('event_time', { ascending: true });
  if (error) throw error;
  return (data || []) as WaterEvent[];
}

