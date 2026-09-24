import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'nodejs';

export async function POST(req) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET || !supabaseAdmin) {
    return NextResponse.json({ error: 'Webhook is not configured' }, { status: 500 });
  }

  const signature = req.headers.get('stripe-signature');
  let event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return NextResponse.json({ error: `Invalid webhook: ${error.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object;
    const orderId = session.metadata?.order_id;
    if (orderId) {
      const { data: order } = await supabaseAdmin.from('orders').select('status').eq('id', orderId).single();
      if (order?.status !== 'paid') {
        const { data: reserved, error: reserveError } = await supabaseAdmin.rpc('reserve_order_inventory', { order_uuid: orderId });
        if (reserveError) return NextResponse.json({ error: 'Inventory reservation failed' }, { status: 500 });
        await supabaseAdmin.from('orders').update({
          status: reserved ? 'paid' : 'payment_review',
          total: session.amount_total ? session.amount_total / 100 : undefined,
          customer_email: session.customer_details?.email || session.customer_email || null,
          customer_name: session.shipping_details?.name || session.customer_details?.name || null,
          customer_phone: session.customer_details?.phone || null,
          shipping_address: session.shipping_details?.address || null,
          updated_at: new Date().toISOString()
        }).eq('id', orderId);
      }
    }
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    await supabaseAdmin.from('orders').update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_session_id', session.id).eq('status', 'pending');
  }

  if (event.type === 'charge.refunded') {
    const charge = event.data.object;
    if (charge.payment_intent) {
      const { data: session } = await stripe.checkout.sessions.list({ payment_intent: charge.payment_intent, limit: 1 });
      if (session?.[0]?.id) {
        await supabaseAdmin.from('orders').update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('stripe_session_id', session[0].id);
      }
    }
  }

  return NextResponse.json({ received: true });
}