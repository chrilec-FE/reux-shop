'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function WishlistPage() {
  const [products, setProducts] = useState([]);
  const [message, setMessage] = useState('Loading wishlist…');

  useEffect(() => {
    async function load() {
      if (!supabase) return setMessage('Accounts are not configured yet.');
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setMessage('Sign in to view your wishlist.');
      const { data, error } = await supabase.from('wishlists').select('product_id, products(id, name, price, image_url)').eq('user_id', auth.user.id).order('created_at', { ascending: false });
      if (error) return setMessage('Could not load your wishlist.');
      const saved = (data || []).map((item) => item.products).filter(Boolean);
      setProducts(saved);
      setMessage(saved.length ? '' : 'Your wishlist is empty.');
    }
    load();
  }, []);

  if (message && products.length === 0) return <div className="animate-rise py-20 text-center"><p className="text-neutral-500">{message}</p><Link href="/shop" className="btn-primary mt-6">Browse shop</Link></div>;
  return <div className="animate-rise"><h1 className="text-2xl font-bold tracking-tight">Wishlist</h1><div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{products.map((product) => <Link href={`/product/${product.id}`} key={product.id} className="card overflow-hidden"><div className="aspect-[3/4] bg-neutral-100">{product.image_url && <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />}</div><div className="p-4"><p className="font-medium">{product.name}</p><p className="mt-1 text-sm text-neutral-600">${Number(product.price).toFixed(2)}</p></div></Link>)}</div></div>;
}
