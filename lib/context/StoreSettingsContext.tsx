'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { parseSettings, type StoreSettings } from '@/lib/store/settings-schema';

const StoreSettingsContext = createContext<StoreSettings>(parseSettings([]));

/** Settings are fetched once on the server and handed down — no client refetch. */
export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: ReactNode;
}) {
  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

export function useStoreSettings() {
  return useContext(StoreSettingsContext);
}
