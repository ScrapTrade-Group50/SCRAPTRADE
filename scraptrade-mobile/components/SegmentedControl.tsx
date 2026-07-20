import React from 'react';
import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export type SegmentOption<T extends string> = {
  key: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
};

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  const theme = useScreenTheme();
  const { colors, resolved } = theme;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          marginHorizontal: 24,
          marginBottom: 12,
          padding: 4,
          borderRadius: 14,
          backgroundColor: colors.muted,
        },
        style,
      ]}>
      {options.map((option) => {
        const active = value === option.key;
        return (
          <TouchableOpacity
            key={option.key}
            activeOpacity={0.85}
            onPress={() => onChange(option.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10,
              paddingVertical: 9,
              paddingHorizontal: 6,
              backgroundColor: active ? colors.card : 'transparent',
              ...(active
                ? {
                    shadowColor: resolved === 'dark' ? '#000000' : '#18181B',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: resolved === 'dark' ? 0.35 : 0.08,
                    shadowRadius: 4,
                    elevation: active ? 2 : 0,
                  }
                : null),
            }}>
            <Text
              className={active ? 'font-sans-bold' : 'font-sans-semibold'}
              style={{
                fontSize: 12,
                color: active ? colors.primary : colors.mutedForeground,
                textAlign: 'center',
              }}
              numberOfLines={1}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
