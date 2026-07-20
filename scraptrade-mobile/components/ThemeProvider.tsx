import React, { useEffect, useMemo } from 'react';
import { Appearance, Platform, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { VariableContextProvider, vars } from 'nativewind';
import { getThemeColors, getThemeVariables } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';

type ThemeProviderProps = {
  children: React.ReactNode;
};

function applyWebDocumentTheme(resolved: 'light' | 'dark') {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  const root = document.documentElement;
  root.style.colorScheme = resolved;
  root.dataset.theme = resolved;

  const themeVars = getThemeVariables(resolved);
  for (const [key, value] of Object.entries(themeVars)) {
    root.style.setProperty(key, value);
  }

  document.body.style.backgroundColor = getThemeColors(resolved).background;
}

export default function ThemeProvider({ children }: ThemeProviderProps) {
  const mode = useThemeStore((s) => s.mode);
  const resolved = useThemeStore((s) => s.resolved);
  const hydrate = useThemeStore((s) => s.hydrate);
  const syncSystemScheme = useThemeStore((s) => s.syncSystemScheme);
  const colors = useThemeStore((s) => s.colors);

  const cssVariables = useMemo(() => getThemeVariables(resolved), [resolved]);
  const varStyle = useMemo(() => vars(cssVariables), [cssVariables]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // NativeWind v5: prefers-color-scheme is driven by Appearance.
  useEffect(() => {
    Appearance.setColorScheme(resolved);
    applyWebDocumentTheme(resolved);
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [resolved, colors.background]);

  useEffect(() => {
    if (mode !== 'system') return;
    const sub = Appearance.addChangeListener(() => {
      syncSystemScheme();
    });
    return () => sub.remove();
  }, [mode, syncSystemScheme]);

  return (
    <VariableContextProvider value={cssVariables}>
      <View
        key={resolved}
        className="flex-1 bg-background"
        style={[{ flex: 1, backgroundColor: colors.background }, varStyle]}>
        <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
        {children}
      </View>
    </VariableContextProvider>
  );
}
