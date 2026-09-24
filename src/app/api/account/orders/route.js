import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

async function userFromRequest(req) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
  return data.user || null;
}

export async function GET(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to view your orders' }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, items, total, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data || [] });
}