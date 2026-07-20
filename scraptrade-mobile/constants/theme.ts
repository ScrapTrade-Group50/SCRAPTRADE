export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

/**
 * Premium zinc palette with clear elevation steps.
 * Dark: background (#09090B) → card (#18181B) → muted/border (#27272A / #3F3F46)
 */
export const lightColors = {
  background: '#F4F4F5',
  foreground: '#18181B',
  card: '#FAFAFA',
  muted: '#E4E4E7',
  mutedForeground: '#71717A',
  primary: '#18181B',
  accent: '#4F46E5',
  border: '#D4D4D8',
  success: '#059669',
  destructive: '#DC2626',
  inverse: '#27272A',
  onAccent: '#FAFAFA',
  onInverse: '#F4F4F5',
} as const;

export const darkColors = {
  background: '#09090B',
  foreground: '#FAFAFA',
  card: '#18181B',
  muted: '#27272A',
  mutedForeground: '#A1A1AA',
  primary: '#FAFAFA',
  accent: '#818CF8',
  border: '#3F3F46',
  success: '#34D399',
  destructive: '#F87171',
  inverse: '#030712',
  onAccent: '#0F172A',
  onInverse: '#FAFAFA',
} as const;

export type ThemeColors = typeof lightColors;

export function getThemeColors(scheme: ResolvedTheme): ThemeColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

/** CSS variable overrides for NativeWind VariableContextProvider + web documentElement */
export function getThemeVariables(scheme: ResolvedTheme): Record<`--${string}`, string> {
  const c = getThemeColors(scheme);
  return {
    '--color-background': c.background,
    '--color-foreground': c.foreground,
    '--color-card': c.card,
    '--color-muted': c.muted,
    '--color-muted-foreground': c.mutedForeground,
    '--color-primary': c.primary,
    '--color-accent': c.accent,
    '--color-border': c.border,
    '--color-success': c.success,
    '--color-destructive': c.destructive,
    '--color-inverse': c.inverse,
    '--color-on-accent': c.onAccent,
    '--color-on-inverse': c.onInverse,
  };
}
