import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';

export async function GET(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: data });
}

export async function PATCH(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { id, status, trackingNumber, trackingUrl } = await req.json();
  const allowedStatuses = ['pending', 'paid', 'payment_review', 'shipped', 'canceled', 'refunded'];
  if (!id || !allowedStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid order status' }, { status: 400 });
  }
  const { data, error } = await supabaseAdmin.from('orders').update({ status, ...(trackingNumber !== undefined ? { tracking_number: trackingNumber } : {}), ...(trackingUrl !== undefined ? { tracking_url: trackingUrl } : {}), updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}
