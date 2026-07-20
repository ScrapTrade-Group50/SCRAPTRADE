import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useScreenTheme } from '@/hooks/useScreenTheme';

type EmptyStateProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  const theme = useScreenTheme();
  const { colors } = theme;

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View
        className="mb-6 h-24 w-24 items-center justify-center rounded-full"
        style={theme.cardMuted}>
        <Feather name={icon} size={40} color={colors.mutedForeground} />
      </View>

      <Text className="mb-2 text-center text-xl font-sans-bold" style={theme.textPrimary}>
        {title}
      </Text>

      <Text className="mb-8 text-center text-base font-sans-medium" style={theme.textMuted}>
        {message}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="rounded-xl border px-6 py-3"
          style={theme.accentSoft}>
          <Text className="text-sm font-sans-bold" style={theme.textAccent}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
