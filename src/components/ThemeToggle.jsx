'use client';

import { useEffect, useState } from 'react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('reux_theme');
    const enabled = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDark(enabled);
    document.documentElement.classList.toggle('dark', enabled);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem('reux_theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };

  return <button type="button" onClick={toggle} className="theme-toggle" aria-label={dark ? 'Use light mode' : 'Use dark mode'} title={dark ? 'Light mode' : 'Dark mode'}>{dark ? '☀' : '☾'}</button>;
}
