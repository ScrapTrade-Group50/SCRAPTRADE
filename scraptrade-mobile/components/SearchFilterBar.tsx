import React from 'react';
import { View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { FilterButton } from '@/components/ListingFilterSheet';

type SearchFilterBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  onFilterPress: () => void;
  filtersActive?: boolean;
  compact?: boolean;
};

export default function SearchFilterBar({
  value,
  onChangeText,
  placeholder,
  onFilterPress,
  filtersActive = false,
  compact = false,
}: SearchFilterBarProps) {
  const theme = useScreenTheme();
  const { colors } = theme;

  return (
    <View className={`flex-row gap-3 ${compact ? 'mx-6 mb-3' : 'px-5'}`}>
      <View
        className={`flex-1 flex-row items-center rounded-2xl border px-4 ${compact ? 'h-12' : 'h-14'}`}
        style={theme.inputSurface}>
        <Feather name="search" size={compact ? 18 : 20} color={colors.mutedForeground} />
        <TextInput
          className={`ml-2 flex-1 font-sans-medium ${compact ? 'text-sm' : 'text-base'}`}
          style={theme.textPrimary}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
      <FilterButton onPress={onFilterPress} active={filtersActive} size={compact ? 'sm' : 'md'} />
    </View>
  );
}
