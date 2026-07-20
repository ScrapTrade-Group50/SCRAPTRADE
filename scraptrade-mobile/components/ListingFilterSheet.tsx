import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Button } from '@/components/ui';

export type ListingSortKey = 'newest' | 'price_asc' | 'price_desc';
export type ListingCategoryFilter = 'ALL' | 'METAL' | 'WOOD' | 'TEXTILE';

const SORT_OPTIONS: { key: ListingSortKey; label: string; hint: string }[] = [
  { key: 'newest', label: 'Newest', hint: 'Recently listed first' },
  { key: 'price_asc', label: 'Price: low to high', hint: 'Cheapest total first' },
  { key: 'price_desc', label: 'Price: high to low', hint: 'Most expensive first' },
];

const CATEGORY_OPTIONS: { key: ListingCategoryFilter; label: string }[] = [
  { key: 'ALL', label: 'All types' },
  { key: 'METAL', label: 'Metal' },
  { key: 'WOOD', label: 'Wood' },
  { key: 'TEXTILE', label: 'Textile' },
];

type ListingFilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  sortBy: ListingSortKey;
  onSortChange: (value: ListingSortKey) => void;
  categoryFilter: ListingCategoryFilter;
  onCategoryChange: (value: ListingCategoryFilter) => void;
  maxPrice?: number;
  onMaxPriceChange?: (value: number) => void;
  priceLimit?: number;
  onReset: () => void;
};

export default function ListingFilterSheet({
  visible,
  onClose,
  sortBy,
  onSortChange,
  categoryFilter,
  onCategoryChange,
  maxPrice,
  onMaxPriceChange,
  priceLimit = 5000,
  onReset,
}: ListingFilterSheetProps) {
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const showPrice = maxPrice !== undefined && onMaxPriceChange !== undefined;

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View className="flex-1 justify-end" style={theme.modalOverlay}>
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View
          className="mt-auto max-h-[85%] rounded-t-[32px] border-t"
          style={[theme.varStyle, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <View className="items-center pb-2 pt-3">
            <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
          </View>

          <View
            className="flex-row items-center justify-between border-b px-6 py-4"
            style={{ borderBottomColor: colors.border }}>
            <Text className="text-xl font-sans-bold" style={theme.textPrimary}>
              Filters
            </Text>
            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={onReset}
                className="rounded-full px-3 py-2"
                style={theme.cardMuted}>
                <Text className="text-sm font-sans-bold" style={theme.textAccent}>
                  Reset
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onClose}
                className="h-10 w-10 items-center justify-center rounded-full"
                style={theme.cardMuted}>
                <Feather name="x" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            className="flex-shrink"
            contentContainerStyle={{ gap: 28, paddingHorizontal: 24, paddingVertical: 24 }}
            showsVerticalScrollIndicator={false}>
            <View>
              <Text className="mb-3 text-sm font-sans-bold uppercase tracking-wider" style={theme.sectionLabel}>
                Sort by
              </Text>
              <View className="gap-2">
                {SORT_OPTIONS.map((option) => {
                  const active = sortBy === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => onSortChange(option.key)}
                      activeOpacity={0.85}
                      className="flex-row items-center justify-between rounded-2xl border px-4 py-3.5"
                      style={
                        active
                          ? { ...theme.accentSoft, borderColor: colors.accent }
                          : { ...theme.card, borderColor: colors.border }
                      }>
                      <View className="flex-1 pr-3">
                        <Text
                          className="font-sans-bold"
                          style={active ? theme.textAccent : theme.textPrimary}>
                          {option.label}
                        </Text>
                        <Text className="mt-0.5 text-xs font-sans-medium" style={theme.textMuted}>
                          {option.hint}
                        </Text>
                      </View>
                      {active ? <Feather name="check-circle" size={20} color={colors.accent} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="mb-3 text-sm font-sans-bold uppercase tracking-wider" style={theme.sectionLabel}>
                Material type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {CATEGORY_OPTIONS.map((option) => {
                  const active = categoryFilter === option.key;
                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => onCategoryChange(option.key)}
                      activeOpacity={0.85}
                      className="rounded-full border px-4 py-2.5"
                      style={
                        active
                          ? { ...theme.accentSoft, borderColor: colors.accent }
                          : { ...theme.card, borderColor: colors.border }
                      }>
                      <Text
                        className="text-sm font-sans-bold"
                        style={active ? theme.textAccent : theme.textMuted}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {showPrice ? (
              <View>
                <View className="mb-3 flex-row items-center justify-between">
                  <Text className="text-sm font-sans-bold uppercase tracking-wider" style={theme.sectionLabel}>
                    Max total price
                  </Text>
                  <Text className="text-base font-sans-bold" style={theme.textAccent}>
                    {maxPrice >= priceLimit ? 'Any price' : `Up to GHS ${maxPrice}`}
                  </Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={10}
                  maximumValue={priceLimit}
                  step={10}
                  value={maxPrice}
                  onValueChange={onMaxPriceChange}
                  minimumTrackTintColor={colors.accent}
                  maximumTrackTintColor={
                    resolved === 'dark' ? 'rgba(148, 163, 184, 0.25)' : 'rgba(15, 23, 42, 0.12)'
                  }
                  thumbTintColor={colors.accent}
                />
              </View>
            ) : null}
          </ScrollView>

          <View
            className="border-t px-6 pb-10 pt-4"
            style={{ backgroundColor: colors.card, borderTopColor: colors.border }}>
            <Button label="Show results" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FilterButton({
  onPress,
  active,
  size = 'md',
}: {
  onPress: () => void;
  active?: boolean;
  size?: 'md' | 'sm';
}) {
  const theme = useScreenTheme();
  const { colors } = theme;
  const dimension = size === 'sm' ? 48 : 56;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="items-center justify-center rounded-2xl"
      style={{ width: dimension, height: dimension, ...theme.accentFill }}>
      <Feather name="sliders" size={size === 'sm' ? 20 : 22} color={colors.onAccent} />
      {active ? (
        <View
          className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border"
          style={{ backgroundColor: colors.destructive, borderColor: colors.onAccent }}
        />
      ) : null}
    </TouchableOpacity>
  );
}
