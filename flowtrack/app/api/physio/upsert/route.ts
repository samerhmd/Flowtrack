import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return new Response(JSON.stringify({ ok: false, message: 'Missing Supabase envs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      return new Response(JSON.stringify({ ok: false, message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { date, energy, mood, focus_clarity, stress, context } = body || {};
    if (!date || energy === undefined || mood === undefined || focus_clarity === undefined || stress === undefined) {
      return new Response(JSON.stringify({ ok: false, message: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(url, serviceRoleKey);
    const { data, error } = await supabase
      .from('physio_logs')
      .upsert({ user_id: userId, date, energy, mood, focus_clarity, stress, context }, { onConflict: 'user_id,date' })
      .select('*')
      .single();

    if (error) {
      return new Response(JSON.stringify({ ok: false, message: error.message || 'Upsert failed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, message: String(e?.message || e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

