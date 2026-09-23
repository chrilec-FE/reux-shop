'use client';

import { useEffect, useRef } from 'react';
import { useCart } from './CartContext';

export default function ClearCart({ enabled = true }) {
  const { clear } = useCart();
  const hasCleared = useRef(false);

  useEffect(() => {
    if (enabled && !hasCleared.current) {
      hasCleared.current = true;
      clear();
    }
  }, [clear, enabled]);

  return null;
}