'use client';
import { useCallback, useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    try { const s = localStorage.getItem('dthu-theme') as Theme | null; const t = s ?? 'light'; setTheme(t); document.documentElement.classList.toggle('dark', t === 'dark'); } catch {}
    setMounted(true);
  }, []);
  const toggle = useCallback(() => setTheme((p) => { const n: Theme = p === 'light' ? 'dark' : 'light'; try { localStorage.setItem('dthu-theme', n); document.documentElement.classList.toggle('dark', n === 'dark'); } catch {} return n; }), []);
  return { theme, toggleTheme: toggle, mounted };
}
