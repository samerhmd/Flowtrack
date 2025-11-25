import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Missing Supabase envs (URL or service role key).' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email: string = body.email || 'admin@gymie.com';
    const password: string = body.password || 'password';

    const supabase = createClient(url, serviceRoleKey);

    // Check existing user
    const { data: users, error: listErr } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (listErr) throw listErr;
    const existing = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());

    if (existing) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password,
        email_confirm: true,
      });
      if (updErr) throw updErr;
      return new Response(JSON.stringify({ ok: true, message: 'User updated', id: existing.id }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createErr) throw createErr;

    return new Response(JSON.stringify({ ok: true, message: 'User created', id: created.user?.id }), {
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
