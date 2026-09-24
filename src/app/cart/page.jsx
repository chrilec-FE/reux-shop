'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/components/CartContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  const total = items.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  const checkout = async () => {
    setLoading(true);
    setError('');
    try {
      let userId = null;
      let accessToken = null;
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        accessToken = data.session?.access_token || null;
      }
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
        body: JSON.stringify({ items: items.map((i) => ({ id: i.id, qty: i.qty, size: i.size })), couponCode: coupon?.code || null })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) });
    const data = await res.json();
    if (!res.ok) return setCouponError(data.error || 'Invalid coupon');
    setCoupon(data);
  };

  const discount = coupon ? total * coupon.percentOff / 100 : 0;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <Link href="/shop" className="btn-primary mt-6">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[2fr_1fr]">
        <div className="divide-y divide-neutral-200">
          {items.map((i) => (
            <div key={i.key} className="flex gap-4 py-4">
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded bg-neutral-100">
                {i.image_url && <Image src={i.image_url} alt={i.name} fill className="object-cover" sizes="80px" />}
              </div>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{i.name}</p>
                    {i.size && <p className="text-sm text-neutral-500">Size: {i.size}</p>}
                  </div>
                  <p className="font-medium">{formatCurrency(Number(i.price) * i.qty)}</p>
                </div>
                <div className="mt-auto flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    value={i.qty}
                    onChange={(e) => setQty(i.key, parseInt(e.target.value) || 1)}
                    className="input w-20"
                  />
                  <button onClick={() => remove(i.key)} className="text-sm text-neutral-400 underline hover:text-neutral-900">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="card h-fit p-6">
          <div className="flex justify-between text-sm text-neutral-600">
            <span>Subtotal</span>
            <span>{formatCurrency(total)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm text-neutral-600">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="mt-4 flex gap-2">
            <input className="input" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
            <button type="button" className="btn-secondary" onClick={applyCoupon}>Apply</button>
          </div>
          {coupon && <p className="mt-2 text-sm text-green-700">{coupon.code} applied: -{formatCurrency(discount)}</p>}
          {couponError && <p className="mt-2 text-sm text-red-600">{couponError}</p>}
          <div className="mt-4 flex justify-between border-t border-neutral-200 pt-4 font-semibold">
            <span>Total</span>
            <span>{formatCurrency(total - discount)}</span>
          </div>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button onClick={checkout} disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Redirecting to Stripe…' : 'Checkout with Stripe'}
          </button>
        </div>
      </div>
    </div>
  );
}
