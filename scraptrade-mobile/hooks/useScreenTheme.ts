import { useMemo } from 'react';
import { vars } from 'nativewind';
import { getThemeVariables } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

export function useScreenTheme() {
  const colors = useThemeStore((s) => s.colors);
  const resolved = useThemeStore((s) => s.resolved);

  return useMemo(() => {
    const cssVariables = getThemeVariables(resolved);

    return {
      colors,
      resolved,
      /** Apply on screen roots so NativeWind token classes resolve against active theme. */
      varStyle: vars(cssVariables),
      root: { flex: 1 as const, backgroundColor: colors.background },
      headerBar: {
        backgroundColor: colors.background,
      },
      sectionSpacing: {
        paddingTop: 8,
      },
      bottomBar: {
        backgroundColor: colors.background,
        borderTopColor: colors.border,
      },
      modalOverlay: {
        backgroundColor: resolved === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.45)',
      },
      floatingControl: {
        backgroundColor: `${colors.inverse}A6`,
      },
      card: {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      cardMuted: {
        backgroundColor: colors.muted,
      },
      inputSurface: {
        backgroundColor: colors.card,
        borderColor: colors.border,
      },
      textPrimary: { color: colors.primary },
      textMuted: { color: colors.mutedForeground },
      textAccent: { color: colors.accent },
      textSuccess: { color: colors.success },
      textOnAccent: { color: colors.onAccent },
      sectionLabel: { color: colors.mutedForeground },
      accentSoft: {
        backgroundColor: `${colors.accent}1A`,
        borderColor: `${colors.accent}40`,
      },
      accentFill: { backgroundColor: colors.accent },
      successSoft: { backgroundColor: `${colors.success}1A` },
      /** Typography scale — use inline styles for consistent hierarchy. */
      type: {
        pageTitle: { fontSize: 28, fontFamily: 'sans-extrabold', color: colors.primary },
        pageSubtitle: { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground },
        screenTitle: { fontSize: 20, fontFamily: 'sans-bold', color: colors.primary },
        sectionTitle: { fontSize: 17, fontFamily: 'sans-bold', color: colors.primary },
        sectionLabel: {
          fontSize: 12,
          fontFamily: 'sans-bold',
          color: colors.mutedForeground,
          letterSpacing: 1.2,
          textTransform: 'uppercase' as const,
        },
        cardTitle: { fontSize: 18, fontFamily: 'sans-bold', color: colors.primary },
        body: { fontSize: 14, fontFamily: 'sans-medium', color: colors.mutedForeground },
      },
    };
  }, [colors, resolved]);
}
