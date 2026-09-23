'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  // Load cart from browser storage once, when the site first loads
  useEffect(() => {
    try {
      setItems(JSON.parse(localStorage.getItem('reux_cart') || '[]'));
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let active = true;
    import('@/lib/supabase').then(async ({ supabase }) => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const response = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
      const saved = await response.json();
      if (active && saved.items?.length) setItems(saved.items);
    });
    return () => { active = false; };
  }, [ready]);

  // Save cart to browser storage every time it changes
  useEffect(() => {
    localStorage.setItem('reux_cart', JSON.stringify(items));
    import('@/lib/supabase').then(async ({ supabase }) => {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ items }) });
    });
  }, [items, ready]);

  // useCallback = "create this function ONCE, never recreate it on re-renders"
  const add = useCallback((product, size, qty = 1) => {
    setItems((prev) => {
      const key = `${product.id}:${size || 'default'}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        { key, id: product.id, name: product.name, price: product.price, image_url: product.image_url, size: size || null, qty }
      ];
    });
  }, []);

  const setQty = useCallback((key, qty) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.key !== key) : prev.map((i) => (i.key === key ? { ...i, qty } : i))));
  }, []);

  const remove = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  // useMemo = "only create this object again when items/count actually change"
  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count }),
    [items, add, setQty, remove, clear, count]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}