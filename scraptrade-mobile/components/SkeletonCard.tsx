import React from 'react';
import { View } from 'react-native';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export default function SkeletonCard() {
  const theme = useScreenTheme();

  return (
    <View
      className="mb-3 flex-row items-center rounded-2xl border p-3 opacity-70"
      style={theme.card}>
      <View className="h-24 w-24 rounded-xl" style={theme.cardMuted} />

      <View className="ml-4 flex-1 justify-center">
        <View className="mb-2 flex-row items-center justify-between">
          <View className="h-3 w-16 rounded-md" style={theme.cardMuted} />
          <View className="h-4 w-4 rounded-md" style={theme.cardMuted} />
        </View>

        <View className="mb-2 h-5 w-3/4 rounded-md" style={theme.cardMuted} />
        <View className="mb-3 h-3 w-1/2 rounded-md" style={theme.cardMuted} />
        <View className="h-6 w-24 rounded-md" style={theme.cardMuted} />
      </View>
    </View>
  );
}
