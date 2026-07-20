import React from 'react';
import { SafeAreaView, type SafeAreaViewProps } from 'react-native-safe-area-context';
import { useScreenTheme } from '@/hooks/useScreenTheme';

type ThemedSafeAreaViewProps = SafeAreaViewProps;

/** Screen root with inline theme background + CSS vars for NativeWind children. */
export default function ThemedSafeAreaView({
  style,
  edges = ['top'],
  className = 'flex-1',
  ...rest
}: ThemedSafeAreaViewProps) {
  const theme = useScreenTheme();

  return (
    <SafeAreaView
      edges={edges}
      className={className}
      style={[
        theme.root,
        theme.varStyle,
        style,
      ]}
      {...rest}
    />
  );
}
