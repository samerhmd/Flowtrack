import { SupabaseClient } from '@supabase/supabase-js';

export interface CaffeineEvent {
  id: string;
  user_id: string;
  created_at: string;
  event_time: string;
  date: string;
  mg: number;
  source?: string | null;
  label?: string | null;
  session_id?: string | null;
}

export interface CaffeineEventInput {
  event_time?: string;
  mg: number;
  source?: string;
  label?: string;
  session_id?: string;
}

export async function createCaffeineEvent(
  supabase: SupabaseClient,
  input: CaffeineEventInput
): Promise<CaffeineEvent> {
  const payload: any = {
    mg: input.mg,
    source: input.source ?? null,
    label: input.label ?? null,
    session_id: input.session_id ?? null,
  };
  if (input.event_time) {
    payload.event_time = input.event_time;
    payload.date = new Date(input.event_time).toISOString().slice(0, 10);
  }
  const { data, error } = await supabase
    .from('caffeine_events')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return data as CaffeineEvent;
}

export async function getCaffeineEventsForDate(
  supabase: SupabaseClient,
  date: string
): Promise<CaffeineEvent[]> {
  const { data, error } = await supabase
    .from('caffeine_events')
    .select('*')
    .eq('date', date)
    .order('event_time', { ascending: true });
  if (error) throw error;
  return (data || []) as CaffeineEvent[];
}

