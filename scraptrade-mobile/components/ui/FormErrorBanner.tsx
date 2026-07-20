import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';

type FormErrorBannerProps = {
  message?: string | null;
};

export default function FormErrorBanner({ message }: FormErrorBannerProps) {
  const colors = useThemeStore((s) => s.colors);
  if (!message) return null;

  return (
    <View className="mb-4 flex-row items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3">
      <Feather name="alert-circle" size={20} color={colors.destructive} />
      <Text className="flex-1 text-sm font-sans-medium leading-5 text-destructive">{message}</Text>
    </View>
  );
}
