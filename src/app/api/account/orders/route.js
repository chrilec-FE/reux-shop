import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { cleanupStaleReceivedOrders } from '@/lib/order-cleanup';

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

  await cleanupStaleReceivedOrders();

  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, items, total, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orders = data || [];
  const orderIds = orders.map((order) => order.id);
  let returnRequests = [];
  if (orderIds.length > 0) {
    const { data: requests } = await supabaseAdmin
      .from('return_requests')
      .select('id, order_id, status, reason, created_at')
      .in('order_id', orderIds)
      .neq('status', 'rejected');
    returnRequests = requests || [];
  }
  const requestMap = new Map(returnRequests.map((request) => [request.order_id, request]));
  return NextResponse.json({
    orders: orders.map((order) => ({ ...order, return_request: requestMap.get(order.id) || null }))
  });
}

export async function PATCH(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to update your orders' }, { status: 401 });

  const { id, status } = await req.json();
  if (!id || !['shipped', 'received'].includes(status)) {
    return NextResponse.json({ error: 'Invalid order change' }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: 'You can only update your own orders' }, { status: 403 });

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, items, total, status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ order: data });
}

export async function DELETE(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to delete your orders' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Order id is required' }, { status: 400 });

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status')
    .eq('id', id)
    .single();

  if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: 'You can only delete your own orders' }, { status: 403 });
  if (order.status !== 'received') return NextResponse.json({ error: 'Only received orders can be deleted' }, { status: 400 });

  const { error } = await supabaseAdmin.from('orders').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}