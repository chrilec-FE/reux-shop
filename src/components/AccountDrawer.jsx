'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatCurrency } from '@/lib/format';

export default function AccountDrawer({ open, onClose }) {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (!open || !supabase) return;
    supabase.auth.getSession().then(async ({ data }) => {
      setUser(data.session?.user || null);
      if (data.session?.user) {
        const { data: orderData } = await supabase.from('orders').select('*').eq('user_id', data.session.user.id).order('created_at', { ascending: false });
        setOrders(orderData || []);
      }
    });
  }, [open]);

  return <>
    {open && <button aria-label="Close account panel" className="drawer-backdrop" onClick={onClose} />}
    <aside className={`account-drawer ${open ? 'account-drawer-open' : ''}`} aria-hidden={!open}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-700"><h2 className="font-semibold">Account</h2><button onClick={onClose} className="text-xl" aria-label="Close account">×</button></div>
      <div className="p-5">
        {!user ? <><p className="text-sm text-neutral-500">Sign in to view orders and manage your account.</p><Link href="/login" onClick={onClose} className="btn-primary mt-5 w-full">Sign in</Link></> : <>
          <p className="text-sm text-neutral-500">{user.email}</p><Link href="/wishlist" onClick={onClose} className="btn-secondary mt-4 w-full">Wishlist</Link>
          <h3 className="mt-8 mb-3 font-medium">Recent orders</h3>
          <div className="space-y-3">{orders.length ? orders.slice(0, 5).map((order) => <div key={order.id} className="border-b border-neutral-100 pb-3 text-sm dark:border-neutral-700"><p className="font-medium">{formatCurrency(order.total)}</p><p className="text-neutral-500">{order.status.replace('_', ' ')}</p>{order.tracking_url && <a className="underline" href={order.tracking_url} target="_blank" rel="noreferrer">Track shipment</a>}</div>) : <p className="text-sm text-neutral-500">No orders yet.</p>}</div>
          <button className="btn-secondary mt-6 w-full" onClick={async () => { await supabase.auth.signOut(); setUser(null); setOrders([]); }}>Sign out</button>
        </>}
      </div>
    </aside>
  </>;
}
