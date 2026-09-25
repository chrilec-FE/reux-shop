'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const TEN_MINUTES = 10 * 60 * 1000;

function canRefreshSafely() {
  if (typeof document === 'undefined') return false;

  const active = document.activeElement;
  if (!active) return true;

  if (active instanceof HTMLElement) {
    const tag = active.tagName.toLowerCase();
    const contentEditable = active.isContentEditable;
    return !(tag === 'input' || tag === 'select' || tag === 'textarea' || contentEditable);
  }

  return true;
}

export default function AdminAutoRefresh() {
  const router = useRouter();

  useEffect(() => {
    const refreshIfSafe = () => {
      if (canRefreshSafely()) router.refresh();
    };

    const intervalId = setInterval(refreshIfSafe, TEN_MINUTES);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refreshIfSafe();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}
