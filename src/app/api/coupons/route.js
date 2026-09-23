import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { code } = await req.json();
  if (!code?.trim()) return NextResponse.json({ error: 'Enter a coupon code' }, { status: 400 });
  const { data, error } = await supabaseAdmin.from('coupons').select('code, percent_off, max_redemptions, redemption_count, expires_at').eq('code', code.trim().toUpperCase()).eq('active', true).maybeSingle();
  if (error || !data) return NextResponse.json({ error: 'Coupon is invalid or expired' }, { status: 400 });
  if (data.expires_at && new Date(data.expires_at) <= new Date()) return NextResponse.json({ error: 'Coupon is expired' }, { status: 400 });
  if (data.max_redemptions && data.redemption_count >= data.max_redemptions) return NextResponse.json({ error: 'Coupon limit reached' }, { status: 400 });
  return NextResponse.json({ code: data.code, percentOff: Number(data.percent_off) });
}
