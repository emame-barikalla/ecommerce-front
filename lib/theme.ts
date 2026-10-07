// Shared by the server layout (boot script) and the client theme hook, so it
// must stay free of 'use client'.

export type Theme = 'light' | 'dark';

export const THEME_KEY = 'theme';

export const THEME_COLORS: Record<Theme, string> = { light: '#fdfbf9', dark: '#151012' };

/**
 * Runs in <head> before first paint: a saved choice wins, otherwise the
 * system preference. Avoids a flash of the wrong theme on load.
 */
export const THEME_BOOT = `try{var t=localStorage.getItem('${THEME_KEY}');if(t!=='light'&&t!=='dark')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';if(t==='dark'){document.documentElement.classList.add('dark');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','${THEME_COLORS.dark}')}}catch(e){}`;
