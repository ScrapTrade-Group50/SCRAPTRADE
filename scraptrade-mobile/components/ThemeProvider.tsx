import React, { useEffect, useMemo } from 'react';
import { Appearance, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { VariableContextProvider, vars } from 'nativewind';
import { getThemeVariables } from '@/constants/theme';
import { useThemeStore } from '@/store/themeStore';
import { applyResolvedColorScheme } from '@/utils/colorScheme';

type ThemeProviderProps = {
  children: React.ReactNode;
};

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

  useEffect(() => {
    applyResolvedColorScheme(resolved);
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
