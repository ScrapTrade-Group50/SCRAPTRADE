import React, { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { useThemeStore } from '@/store/themeStore';

type ThemedScreenProps = ViewProps & {
  className?: string;
  /** Defaults to theme background */
  surface?: 'background' | 'card';
};

/**
 * Screen root that always paints the current theme background via JS colors.
 * Use on SafeAreaView children or as a full-screen wrapper when className tokens lag.
 */
export default function ThemedScreen({
  children,
  style,
  surface = 'background',
  className = 'flex-1',
  ...rest
}: ThemedScreenProps) {
  const colors = useThemeStore((s) => s.colors);
  const backgroundColor = surface === 'card' ? colors.card : colors.background;

  const mergedStyle = useMemo(
    () => [{ flex: 1, backgroundColor }, style],
    [backgroundColor, style]
  );

  return (
    <View className={className} style={mergedStyle} {...rest}>
      {children}
    </View>
  );
}
