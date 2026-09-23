'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function WishlistButton({ productId }) {
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: item } = await supabase.from('wishlists').select('product_id').eq('user_id', data.user.id).eq('product_id', productId).maybeSingle();
      setSaved(Boolean(item));
    });
  }, [productId]);

  const toggle = async () => {
    if (!supabase) return setMessage('Accounts are not configured');
    const { data } = await supabase.auth.getUser();
    if (!data.user) return setMessage('Sign in to save this item');
    if (saved) await supabase.from('wishlists').delete().eq('user_id', data.user.id).eq('product_id', productId);
    else await supabase.from('wishlists').insert({ user_id: data.user.id, product_id: productId });
    setSaved(!saved);
    setMessage(!saved ? 'Saved to wishlist' : 'Removed from wishlist');
  };

  return <div><button type="button" onClick={toggle} className="btn-secondary w-full">{saved ? 'Saved to wishlist' : 'Add to wishlist'}</button>{message && <p className="mt-2 text-center text-xs text-neutral-500">{message}</p>}</div>;
}
