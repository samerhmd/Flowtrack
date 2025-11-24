import { SupabaseClient } from '@supabase/supabase-js';

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  flow_recipe_version?: number;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  activity?: string;
  flow_rating: number;
  notes?: string;
}

export interface SessionCreateInput {
  start_time: string;
  end_time: string;
  duration_seconds: number;
  activity?: string;
  flow_rating: number;
  notes?: string;
  flow_recipe_version?: number;
}

export interface SessionMetaUpdate {
  activity?: string;
  notes?: string;
}

export interface SessionListOptions {
  limit?: number;
  offset?: number;
}

export async function getSessions(supabase: SupabaseClient, options: SessionListOptions = {}): Promise<Session[]> {
  try {
    let query = supabase
      .from('sessions')
      .select('*')
      .order('created_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching sessions:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSessions:', error);
    throw error;
  }
}

export async function getSessionById(supabase: SupabaseClient, id: string): Promise<Session | null> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session by id:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getSessionById:', error);
    throw error;
  }
}

export async function createSession(supabase: SupabaseClient, input: SessionCreateInput): Promise<Session> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert(input)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createSession:', error);
    throw error;
  }
}

export async function updateSessionMeta(supabase: SupabaseClient, id: string, updates: SessionMetaUpdate): Promise<Session> {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating session meta:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateSessionMeta:', error);
    throw error;
  }
}

export async function deleteSession(supabase: SupabaseClient, id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteSession:', error);
    throw error;
  }
}