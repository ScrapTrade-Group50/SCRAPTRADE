import { create } from 'zustand';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ResolvedTheme, ThemeMode } from '@/constants/theme';
import { getThemeColors, type ThemeColors } from '@/constants/theme';

const STORAGE_KEY = 'scraptrade.themeMode';

function resolveScheme(mode: ThemeMode): ResolvedTheme {
  if (mode === 'system') {
    return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

interface ThemeState {
  mode: ThemeMode;
  resolved: ResolvedTheme;
  colors: ThemeColors;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  setMode: (mode: ThemeMode) => Promise<void>;
  toggleDark: () => Promise<void>;
  syncSystemScheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'dark',
  resolved: 'dark',
  colors: getThemeColors('dark'),
  isHydrated: false,

  hydrate: async () => {
    if (get().isHydrated) return;
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      const mode: ThemeMode =
        stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'dark';
      const resolved = resolveScheme(mode);
      Appearance.setColorScheme(resolved);
      set({ mode, resolved, colors: getThemeColors(resolved), isHydrated: true });
    } catch {
      Appearance.setColorScheme('dark');
      set({ mode: 'dark', resolved: 'dark', colors: getThemeColors('dark'), isHydrated: true });
    }
  },

  setMode: async (mode) => {
    const resolved = resolveScheme(mode);
    Appearance.setColorScheme(resolved);
    set({ mode, resolved, colors: getThemeColors(resolved) });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Persistence failure should not block UI theme updates
    }
  },

  toggleDark: async () => {
    const next: ThemeMode = get().resolved === 'dark' ? 'light' : 'dark';
    await get().setMode(next);
  },

  syncSystemScheme: () => {
    if (get().mode !== 'system') return;
    const resolved = resolveScheme('system');
    if (resolved === get().resolved) return;
    Appearance.setColorScheme(resolved);
    set({ resolved, colors: getThemeColors(resolved) });
  },
}));
