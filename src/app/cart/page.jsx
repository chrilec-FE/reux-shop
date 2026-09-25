'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartContext';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';
import { getProductImages } from '@/lib/images';

async function readResponse(response, fallback) {
  const text = await response.text();
  if (!text) return { error: fallback };
  try {
    return JSON.parse(text);
  } catch {
    return { error: fallback };
  }
}

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [profile, setProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!active) return;
      if (!session) {
        setProfileLoading(false);
        return;
      }
      const metadata = session.user.user_metadata || {};
      const savedProfile = {
        first_name: metadata.first_name || '',
        last_name: metadata.last_name || '',
        street_address: metadata.street_address || '',
        postal_code: metadata.postal_code || '',
        city: metadata.city || '',
        country: metadata.country || 'SE'
      };
      setProfile(savedProfile);
      setEditingProfile(!Object.values(savedProfile).every(Boolean));
      setProfileLoading(false);
    };
    loadProfile();
    return () => { active = false; };
  }, []);

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
      const data = await readResponse(res, 'Item out of stock');
      if (!res.ok) throw new Error(data.error || 'Checkout failed');
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    try {
      const session = supabase ? (await supabase.auth.getSession()).data.session : null;
      if (!session) throw new Error('Sign in to update your details');
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(profile)
      });
      const data = await readResponse(res, 'Could not save your details. Please try again.');
      if (!res.ok) throw new Error(data.error || 'Could not save your details');
      setProfile(data.profile);
      setEditingProfile(false);
    } catch (e) {
      setProfileError(e.message);
    } finally {
      setProfileSaving(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: couponCode }) });
    const data = await readResponse(res, 'Could not apply the coupon. Please try again.');
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
                {getProductImages(i)[0] && <Image src={getProductImages(i)[0]} alt={i.name} fill className="object-cover" sizes="80px" />}
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
                  <div className="inline-flex items-center overflow-hidden rounded-md border border-neutral-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQty(i.key, Math.max(1, i.qty - 1))}
                      className="flex h-9 w-9 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100"
                      aria-label={`Decrease quantity for ${i.name}`}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={i.qty}
                      onChange={(e) => setQty(i.key, parseInt(e.target.value) || 1)}
                      className="h-9 w-12 border-x border-neutral-300 bg-white px-2 text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => setQty(i.key, i.qty + 1)}
                      className="flex h-9 w-9 items-center justify-center text-lg text-neutral-700 transition hover:bg-neutral-100"
                      aria-label={`Increase quantity for ${i.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button onClick={() => remove(i.key)} className="text-sm font-medium text-red-500 transition hover:text-red-400">
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
          {!profileLoading && profile && (
            <div className="mt-6 border-t border-neutral-200 pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">Order details</h2>
                  {!editingProfile && <p className="mt-2 text-sm leading-relaxed text-neutral-600">Shipping to: {profile.first_name} {profile.last_name}, {profile.street_address}, {profile.postal_code} {profile.city}, {profile.country}</p>}
                  {editingProfile && <p className="mt-1 text-sm text-neutral-500">Add your shipping details before paying.</p>}
                </div>
                {!editingProfile && <button type="button" className="text-sm underline" onClick={() => setEditingProfile(true)}>Edit</button>}
              </div>
              {editingProfile && (
                <form onSubmit={saveProfile} className="mt-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="First name" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} required />
                    <input className="input" placeholder="Last name" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} required />
                  </div>
                  <input className="input" placeholder="Street address" value={profile.street_address} onChange={(e) => setProfile({ ...profile, street_address: e.target.value })} required />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input className="input" placeholder="Postal code" value={profile.postal_code} onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })} required />
                    <input className="input" placeholder="City" value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} required />
                  </div>
                  <input className="input" placeholder="Country" value={profile.country} onChange={(e) => setProfile({ ...profile, country: e.target.value })} required />
                  {profileError && <p className="text-sm text-red-600">{profileError}</p>}
                  <button className="btn-secondary w-full" disabled={profileSaving}>{profileSaving ? 'Saving…' : 'Save details'}</button>
                </form>
              )}
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          <button onClick={checkout} disabled={loading} className="btn-primary mt-6 w-full">
            {loading ? 'Redirecting to Stripe…' : 'Checkout with Stripe'}
          </button>
        </div>
      </div>
    </div>
  );
}
