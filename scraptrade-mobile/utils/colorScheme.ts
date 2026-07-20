import { Appearance, Platform } from 'react-native';
import { getThemeColors, getThemeVariables, type ResolvedTheme } from '@/constants/theme';

/** Apply resolved theme to NativeWind (native) or document CSS vars (web). */
export function applyResolvedColorScheme(resolved: ResolvedTheme) {
  if (Platform.OS === 'web') {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    root.style.colorScheme = resolved;
    root.dataset.theme = resolved;

    const themeVars = getThemeVariables(resolved);
    for (const [key, value] of Object.entries(themeVars)) {
      root.style.setProperty(key, value);
    }

    document.body.style.backgroundColor = getThemeColors(resolved).background;
    return;
  }

  if (typeof Appearance.setColorScheme === 'function') {
    Appearance.setColorScheme(resolved);
  }
}
