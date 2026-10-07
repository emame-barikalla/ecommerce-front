'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { THEME_COLORS, THEME_KEY, type Theme } from '@/lib/theme';

export type { Theme };

const listeners = new Set<() => void>();

function read(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function apply(next: Theme) {
  const root = document.documentElement;
  // Suppress every colour transition for one frame so the switch is instant.
  root.classList.add('theme-switching');
  root.classList.toggle('dark', next === 'dark');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[next]);
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
  try {
    localStorage.setItem(THEME_KEY, next);
  } catch {
    // Not remembered across visits — the switch still applies now.
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  // The server cannot know the theme; `light` keeps markup stable until hydration.
  const theme = useSyncExternalStore(subscribe, read, () => 'light' as Theme);
  const toggle = useCallback(() => apply(read() === 'dark' ? 'light' : 'dark'), []);
  return { theme, toggle, setTheme: apply };
}
