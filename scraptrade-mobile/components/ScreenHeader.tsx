import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useScreenTheme } from '@/hooks/useScreenTheme';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  showBack?: boolean;
  right?: React.ReactNode;
  subtitle?: string;
};

export default function ScreenHeader({
  title,
  onBack,
  showBack = true,
  right,
  subtitle,
}: ScreenHeaderProps) {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  return (
    <View
      className="flex-row items-center px-6 pb-3 pt-4"
      style={{ backgroundColor: colors.background }}>
      {showBack ? (
        <TouchableOpacity
          onPress={handleBack}
          className="mr-3 h-10 w-10 items-center justify-center rounded-xl border"
          style={{ backgroundColor: colors.card, borderColor: colors.border }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </TouchableOpacity>
      ) : null}

      <View className="min-w-0 flex-1">
        <Text style={theme.type.screenTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="mt-0.5 text-xs font-sans-medium" style={theme.textMuted} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {right ? <View className="ml-3">{right}</View> : null}
    </View>
  );
}
