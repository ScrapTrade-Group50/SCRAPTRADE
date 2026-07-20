import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export type ChipOption<T extends string> = {
  key: T;
  label: string;
};

type FilterChipRowProps<T extends string> = {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  scrollable?: boolean;
};

export default function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  scrollable = true,
}: FilterChipRowProps<T>) {
  const theme = useScreenTheme();
  const { colors } = theme;

  const content = options.map((option) => {
    const active = value === option.key;
    return (
      <TouchableOpacity
        key={option.key}
        onPress={() => onChange(option.key)}
        activeOpacity={0.85}
        style={{
          borderRadius: 999,
          paddingHorizontal: 14,
          paddingVertical: 8,
          marginRight: 8,
          borderWidth: 1,
          borderColor: active ? colors.accent : colors.border,
          backgroundColor: active ? `${colors.accent}18` : colors.card,
        }}>
        <Text
          className={active ? 'font-sans-bold' : 'font-sans-semibold'}
          style={{
            fontSize: 12,
            color: active ? colors.accent : colors.mutedForeground,
          }}>
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  });

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 4 }}>
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 24 }}>
      {content}
    </View>
  );
}
