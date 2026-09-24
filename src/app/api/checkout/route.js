import { NextResponse } from 'next/server';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local' }, { status: 500 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 });
  }

  const { items, couponCode } = await req.json();
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization');
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  let user = null;
  if (accessToken) {
    const { data } = await supabaseAdmin.auth.getUser(accessToken);
    user = data.user || null;
  }

  const normalizedItems = items.map((item) => ({
    id: item?.id,
    qty: Number(item?.qty),
    size: item?.size || null
  }));
  if (normalizedItems.some((item) => !item.id || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 99)) {
    return NextResponse.json({ error: 'Invalid cart quantity or product' }, { status: 400 });
  }

  const productIds = [...new Set(normalizedItems.map((item) => item.id))];
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products').select('*').in('id', productIds);
  if (productsError) return NextResponse.json({ error: 'Could not load products' }, { status: 500 });
  if (!products || products.length !== productIds.length) {
    return NextResponse.json({ error: 'One or more products are no longer available' }, { status: 400 });
  }

  const quantities = normalizedItems.reduce((result, item) => {
    result[item.id] = (result[item.id] || 0) + item.qty;
    return result;
  }, {});
  for (const product of products) {
    if (quantities[product.id] > product.stock) {
      return NextResponse.json({ error: `${product.name} does not have enough stock` }, { status: 409 });
    }
    for (const item of normalizedItems.filter((entry) => entry.id === product.id)) {
      if (item.size && product.sizes?.length && !product.sizes.includes(item.size)) {
        return NextResponse.json({ error: `Invalid size for ${product.name}` }, { status: 400 });
      }
    }
  }

  let total = 0;
  let line_items = normalizedItems.map((i) => {
    const p = products.find((x) => x.id === i.id);
    total += Number(p.price) * i.qty;
    return {
      quantity: i.qty,
      price_data: {
        currency: 'sek',
        unit_amount: Math.round(Number(p.price) * 100),
        product_data: {
          name: p.name,
          images: p.image_url ? [p.image_url] : []
        }
      }
    };
  });

  let discount = 0;
  let appliedCoupon = null;
  let couponPercent = 0;
  if (couponCode?.trim()) {
    const { data: coupon } = await supabaseAdmin.from('coupons').select('code, percent_off, max_redemptions, redemption_count, expires_at').eq('code', couponCode.trim().toUpperCase()).eq('active', true).maybeSingle();
    if (!coupon || (coupon.expires_at && new Date(coupon.expires_at) <= new Date()) || (coupon.max_redemptions && coupon.redemption_count >= coupon.max_redemptions)) {
      return NextResponse.json({ error: 'Coupon is invalid or expired' }, { status: 400 });
    }
    discount = Math.round(total * Number(coupon.percent_off)) / 100;
    appliedCoupon = coupon.code;
    couponPercent = Number(coupon.percent_off);
    total = Math.max(0, total - discount);
  }
  if (couponPercent) {
    line_items = line_items.map((item) => ({
      ...item,
      price_data: { ...item.price_data, unit_amount: Math.max(1, Math.round(item.price_data.unit_amount * (1 - couponPercent / 100))) }
    }));
  }

  const orderItems = normalizedItems.map((i) => {
    const p = products.find((x) => x.id === i.id);
    return { id: p.id, name: p.name, price: p.price, qty: i.qty, size: i.size, image_url: p.image_url };
  });
  const { data: order, error: orderError } = await supabaseAdmin.from('orders').insert({
    user_id: user?.id || null,
    items: orderItems,
    total,
    discount,
    coupon_code: appliedCoupon,
    status: 'pending'
  }).select('id').single();
  if (orderError) return NextResponse.json({ error: 'Could not create order' }, { status: 500 });

  const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const metadata = user?.user_metadata || {};
  const customerName = [metadata.first_name, metadata.last_name].filter(Boolean).join(' ');
  const hasShippingProfile = customerName && metadata.street_address && metadata.postal_code && metadata.city && metadata.country;
  let stripeCustomer;
  if (user && hasShippingProfile) {
    try {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: customerName,
        shipping: {
          name: customerName,
          address: {
            line1: metadata.street_address,
            postal_code: metadata.postal_code,
            city: metadata.city,
            country: metadata.country.toUpperCase()
          }
        }
      });
    } catch (error) {
      return NextResponse.json({ error: `Could not prepare customer details: ${error.message}` }, { status: 500 });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cart`,
    ...(stripeCustomer ? { customer: stripeCustomer.id } : { customer_email: user?.email || undefined, customer_creation: 'always' }),
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: ['SE'] },
    metadata: { order_id: order.id }
  });

  await supabaseAdmin.from('orders').update({ stripe_session_id: session.id }).eq('id', order.id);

  return NextResponse.json({ url: session.url });
}
