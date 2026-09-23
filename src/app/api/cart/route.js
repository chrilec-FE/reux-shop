import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function userFromRequest(req) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
  return data.user || null;
}

export async function GET(req) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ items: [] });
  const { data } = await supabaseAdmin.from('user_carts').select('items').eq('user_id', user.id).maybeSingle();
  return NextResponse.json({ items: data?.items || [] });
}

export async function PUT(req) {
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  const { items } = await req.json();
  if (!Array.isArray(items)) return NextResponse.json({ error: 'Invalid cart' }, { status: 400 });
  const { error } = await supabaseAdmin.from('user_carts').upsert({ user_id: user.id, items, updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
