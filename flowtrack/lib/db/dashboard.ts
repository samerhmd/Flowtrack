import { SupabaseClient } from '@supabase/supabase-js';
import type { Session } from './sessions';

export interface DashboardData {
  todayPhysio: {
    energy: number;
    mood: number;
    focus_clarity: number;
    stress: number;
    context: string | null;
  } | null;
  todaySessions: Session[];
  last7Days: {
    sessionCount: number;
    avgFlow: number | null;
  };
}

export async function getDashboardData(supabase: SupabaseClient): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);
  
  // Get today's physio log
  const { data: physioData, error: physioError } = await supabase
    .from('physio_logs')
    .select('energy, mood, focus_clarity, stress, context')
    .eq('date', today)
    .maybeSingle();

  // Gracefully handle transient fetch errors
  if (physioError) {
    console.warn('Today physio unavailable:', physioError?.message || physioError);
  }

  // Get today's sessions
  const { data: todaySessionsData, error: todaySessionsError } = await supabase
    .from('sessions')
    .select('*')
    .eq('date', today)
    .order('start_time', { ascending: false });

  if (todaySessionsError) {
    console.warn('Today sessions unavailable:', todaySessionsError?.message || todaySessionsError);
  }

  // Get last 7 days sessions
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fromDate = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: last7DaysData, error: last7DaysError } = await supabase
    .from('sessions')
    .select('flow_rating')
    .gte('date', fromDate)
    .lte('date', today);

  if (last7DaysError) {
    console.warn('Last 7 days sessions unavailable:', last7DaysError?.message || last7DaysError);
  }

  const sessionCount = last7DaysData?.length || 0;
  const flowRatings = last7DaysData?.filter(s => s.flow_rating !== null).map(s => s.flow_rating) || [];
  const avgFlow = flowRatings.length > 0 
    ? flowRatings.reduce((sum, rating) => sum + rating, 0) / flowRatings.length 
    : null;

  return {
    todayPhysio: physioData ?? null,
    todaySessions: todaySessionsData || [],
    last7Days: {
      sessionCount,
      avgFlow
    }
  };
}
