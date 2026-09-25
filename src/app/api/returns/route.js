import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { checkAdminRequest } from '@/lib/admin-auth';

const RETURNABLE_STATUSES = ['paid', 'packaging', 'shipped', 'received'];
const RETURN_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;
const ADMIN_STATUSES = ['requested', 'approved', 'completed', 'rejected'];

async function userFromRequest(req) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ') || !supabaseAdmin) return null;
  const { data } = await supabaseAdmin.auth.getUser(header.slice(7));
  return data.user || null;
}

function orderTimestamp(order) {
  return Math.max(new Date(order.updated_at || 0).getTime(), new Date(order.created_at || 0).getTime());
}

function isWithinReturnWindow(order) {
  return Date.now() - orderTimestamp(order) < RETURN_WINDOW_MS;
}

async function addCustomerDetails(requests) {
  const orderIds = [...new Set(requests.map((request) => request.order_id))];
  const userIds = [...new Set(requests.map((request) => request.user_id).filter(Boolean))];
  const [{ data: orders }, profiles] = await Promise.all([
    supabaseAdmin.from('orders').select('id, total, items, customer_name, customer_email').in('id', orderIds),
    Promise.all(userIds.map(async (userId) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
      return error || !data.user ? [userId, {}] : [userId, data.user.user_metadata || {}];
    }))
  ]);
  const orderMap = new Map((orders || []).map((order) => [order.id, order]));
  const profileMap = new Map(profiles);

  return requests.map((request) => {
    const order = orderMap.get(request.order_id) || {};
    const metadata = profileMap.get(request.user_id) || {};
    const profileName = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ');
    return {
      ...request,
      order: {
        id: order.id || request.order_id,
        total: order.total,
        items: order.items || [],
        customer_name: order.customer_name || profileName || order.customer_email || '—',
        customer_email: order.customer_email || null
      }
    };
  });
}

export async function GET(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { data, error } = await supabaseAdmin.from('return_requests').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: await addCustomerDetails(data || []) });
}

export async function POST(req) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  const user = await userFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Sign in to request a return' }, { status: 401 });

  const { orderId, reason } = await req.json();
  if (!orderId) return NextResponse.json({ error: 'Order id is required' }, { status: 400 });

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, created_at, updated_at')
    .eq('id', orderId)
    .single();

  if (orderError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  if (order.user_id !== user.id) return NextResponse.json({ error: 'You can only request returns for your own orders' }, { status: 403 });
  if (!RETURNABLE_STATUSES.includes(order.status)) return NextResponse.json({ error: 'This order is not eligible for a return' }, { status: 400 });
  if (!isWithinReturnWindow(order)) return NextResponse.json({ error: 'The 14-day return window has expired' }, { status: 400 });

  const { data: activeRequest } = await supabaseAdmin
    .from('return_requests')
    .select('id, status')
    .eq('order_id', orderId)
    .neq('status', 'rejected')
    .maybeSingle();
  if (activeRequest) return NextResponse.json({ error: 'A return has already been requested for this order', request: activeRequest }, { status: 409 });

  const { data, error } = await supabaseAdmin
    .from('return_requests')
    .insert({ order_id: orderId, user_id: user.id, reason: typeof reason === 'string' ? reason.trim() || null : null })
    .select('id, order_id, status, reason, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A return has already been requested for this order' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ request: data }, { status: 201 });
}

export async function PATCH(req) {
  if (!checkAdminRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!supabaseAdmin) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });

  const { id, status } = await req.json();
  if (!id || !ADMIN_STATUSES.includes(status)) return NextResponse.json({ error: 'Invalid return status' }, { status: 400 });

  const { data: request, error: requestError } = await supabaseAdmin.from('return_requests').select('id, order_id').eq('id', id).single();
  if (requestError || !request) return NextResponse.json({ error: 'Return request not found' }, { status: 404 });

  if (status === 'completed') {
    const { error: orderError } = await supabaseAdmin.from('orders').update({ status: 'refunded', updated_at: new Date().toISOString() }).eq('id', request.order_id);
    if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const { data, error } = await supabaseAdmin
    .from('return_requests')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
