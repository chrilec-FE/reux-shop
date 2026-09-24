import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';

function profileAddress(metadata) {
  if (!metadata.street_address || !metadata.postal_code || !metadata.city || !metadata.country) return null;
  return [metadata.street_address, `${metadata.postal_code} ${metadata.city}`, metadata.country].join(', ');
}

async function addProfileDetails(orders) {
  const userIds = [...new Set(orders.map((order) => order.user_id).filter(Boolean))];
  const profiles = await Promise.all(userIds.map(async (userId) => {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    return error || !data.user ? [userId, null] : [userId, data.user.user_metadata || {}];
  }));
  const profileMap = new Map(profiles);

  return orders.map((order) => {
    if (!order.user_id || !profileMap.has(order.user_id)) return order;
    const metadata = profileMap.get(order.user_id);
    const hasName = metadata.first_name && metadata.last_name;
    return {
      ...order,
      customer_name: hasName ? `${metadata.first_name} ${metadata.last_name}` : (order.customer_email || null),
      shipping_address: profileAddress(metadata)
    };
  });
}

export async function GET(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  const { data, error } = await supabaseAdmin.from('orders').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ orders: await addProfileDetails(data || []) });
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
