import Link from 'next/link';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import ClearCart from '@/components/ClearCart';

export const dynamic = 'force-dynamic';

export default async function SuccessPage({ searchParams }) {
  // Await searchParams for Next.js 15+ compatibility
  const resolvedParams = await searchParams;
  const sessionId = resolvedParams?.session_id;

  let paid = false;
  let total = null;

  if (sessionId) {
    try {
      // 1. Check our own database first
      if (supabaseAdmin) {
        const { data: order } = await supabaseAdmin
        .from('orders')
        .select('status, total')
        .eq('stripe_session_id', sessionId)
        .maybeSingle(); // returns null instead of erroring when no row exists

        if (order?.status === 'paid') {
          paid = true;
          total = Number(order.total);
        }
      }

      // 2. If not confirmed in DB, ask Stripe — but never wait more than 8 seconds
      if (!paid && isStripeConfigured()) {
        const session = await Promise.race([
          stripe.checkout.sessions.retrieve(sessionId),
                                           new Promise((_, reject) =>
                                           setTimeout(() => reject(new Error('Stripe request timed out')), 8000)
                                           ),
        ]);

        paid = session.payment_status === 'paid';
        total = (session.amount_total || 0) / 100;

      }
    } catch (err) {
      // Something went wrong (timeout, network, bad key...) — show the safe message
      console.error('Error confirming payment:', err);
      paid = false;
    }
  }

  return (
    <div className="py-20 text-center">
    <ClearCart enabled={paid} />
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-900 text-3xl text-white">
    ✓
    </div>
    <h1 className="mt-6 text-3xl font-bold tracking-tight">
    {paid ? 'Thank you for your order!' : 'Order received'}
    </h1>
    <p className="mt-3 text-neutral-500">
    {paid
      ? `Your payment of $${total?.toFixed(2)} was successful. Your order confirmation will be sent to your email.`
      : 'We are confirming your payment. Keep this page open briefly, or check your account for the final order status.'}
      </p>
      <Link href="/shop" className="btn-primary mt-8">
      Continue shopping
      </Link>
      </div>
  );
}
