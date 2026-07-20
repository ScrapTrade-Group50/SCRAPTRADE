import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Link, useFocusEffect } from 'expo-router';
import { apiClient } from '@/api/client';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import SegmentedControl from '@/components/SegmentedControl';
import SearchFilterBar from '@/components/SearchFilterBar';
import ListingFilterSheet, {
  type ListingCategoryFilter,
  type ListingSortKey,
} from '@/components/ListingFilterSheet';
import { useSavedStore } from '@/store/savedStore';
import { getApiErrorMessage } from '@/utils/apiErrors';
import { matchesListingSearch, type ListingCard } from '@/utils/listingSort';

type Listing = ListingCard;
type StatusFilter = 'all' | 'available' | 'unavailable';

export default function SavedListings() {
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ListingCategoryFilter>('ALL');
  const [sortBy, setSortBy] = useState<ListingSortKey>('newest');
  const [isFilterVisible, setFilterVisible] = useState(false);

  const fetchSavedIds = useSavedStore((state) => state.fetchIds);
  const toggleSaved = useSavedStore((state) => state.toggle);

  const fetchSaved = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/saved-listings');
      setListings(response.data);
      fetchSavedIds();
    } catch (error: unknown) {
      setErrorMessage(getApiErrorMessage(error, 'Could not load your saved items.'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSaved();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaved();
  };

  const hasActiveFilters = categoryFilter !== 'ALL' || sortBy !== 'newest';

  const clearFilters = () => {
    setCategoryFilter('ALL');
    setSortBy('newest');
  };

  const filteredListings = useMemo(() => {
    const totalOf = (item: Listing) => (item.pricePerUnit ?? 0) * (item.weight ?? 0);

    return listings
      .filter((item) => {
        if (!matchesListingSearch(item, searchQuery)) return false;
        if (categoryFilter !== 'ALL' && item.category?.toUpperCase() !== categoryFilter) return false;
        if (statusFilter === 'available' && item.status !== 'AVAILABLE') return false;
        if (statusFilter === 'unavailable' && item.status === 'AVAILABLE') return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return totalOf(a) - totalOf(b);
        if (sortBy === 'price_desc') return totalOf(b) - totalOf(a);
        return b.id - a.id;
      });
  }, [listings, searchQuery, statusFilter, categoryFilter, sortBy]);

  const handleUnsave = async (listingId: number) => {
    setListings((prev) => prev.filter((item) => item.id !== listingId));
    try {
      await toggleSaved(listingId);
    } catch {
      fetchSaved();
    }
  };

  const renderCard = ({ item }: { item: Listing }) => {
    const displayCategory = item.category ? item.category.toUpperCase() : 'MATERIAL';
    const totalPrice = (item.pricePerUnit ?? 0) * (item.weight ?? 0);
    const isAvailable = item.status === 'AVAILABLE';
    const sellerName = item.seller?.companyName?.trim();
    const pickupLine = item.pickupLocation?.trim();

    return (
      <View className="relative mx-6 mb-4">
        <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
          <TouchableOpacity
            activeOpacity={0.8}
            className="flex-row items-center rounded-2xl border p-3 shadow-sm"
            style={theme.card}>
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                className="h-24 w-24 rounded-xl bg-muted"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-xl" style={theme.cardMuted}>
                <Feather name="image" size={28} color={colors.mutedForeground} />
              </View>
            )}

            <View className="ml-4 flex-1 justify-center self-stretch py-1">
              <Text className="mb-1 text-[10px] font-sans-bold uppercase tracking-wider" style={theme.textAccent}>
                {displayCategory}
              </Text>
              <Text className="mb-1 pr-8 text-base font-sans-bold" style={theme.textPrimary} numberOfLines={1}>
                {item.title}
              </Text>
              {sellerName ? (
                <Text className="mb-0.5 text-xs font-sans-semibold" style={theme.textAccent} numberOfLines={1}>
                  Sold by {sellerName}
                </Text>
              ) : null}
              <Text className="mb-2 text-xs font-sans-medium" style={theme.textMuted} numberOfLines={1}>
                {item.weight} kg
                {pickupLine ? ` • ${pickupLine}` : item.dimensions ? ` • ${item.dimensions}` : ''}
              </Text>
              <Text className="mt-auto text-lg font-sans-extrabold" style={theme.textSuccess}>
                GHS {totalPrice.toFixed(2)}
              </Text>
              {!isAvailable && (
                <Text className="mt-0.5 text-[10px] font-sans-bold uppercase" style={theme.textAccent}>
                  No longer available
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          onPress={() => handleUnsave(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: `${colors.background}E6`, borderColor: colors.border }}>
          <Feather name="bookmark" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderListHeader = () => (
    <View className="pb-2">
      <SearchFilterBar
        compact
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search saved items, factories..."
        onFilterPress={() => setFilterVisible(true)}
        filtersActive={hasActiveFilters}
      />

      <SegmentedControl
        style={{ marginBottom: 4 }}
        options={[
          { key: 'all' as const, label: 'All' },
          { key: 'available' as const, label: 'Open' },
          { key: 'unavailable' as const, label: 'Gone' },
        ]}
        value={statusFilter}
        onChange={setStatusFilter}
      />
    </View>
  );

  return (
    <ThemedSafeAreaView edges={['top']}>
      <PageHeader title="Saved" subtitle="Materials you bookmarked" />

      <FlatList
        style={{ flex: 1 }}
        extraData={`${resolved}-${statusFilter}-${categoryFilter}-${sortBy}-${searchQuery}`}
        data={isLoading || errorMessage ? [] : filteredListings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={() => {
          if (errorMessage) {
            return (
              <EmptyState
                icon="alert-triangle"
                title="Sync Error"
                message={errorMessage}
                actionLabel="Try Again"
                onAction={fetchSaved}
              />
            );
          }
          if (isLoading) {
            return (
              <View className="px-6">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            );
          }
          if (statusFilter !== 'all' || hasActiveFilters || searchQuery) {
            return (
              <EmptyState
                icon="filter"
                title="No Matching Items"
                message="Try adjusting your filters or search."
                actionLabel="Clear filters"
                onAction={() => {
                  setStatusFilter('all');
                  clearFilters();
                  setSearchQuery('');
                }}
              />
            );
          }
          return (
            <EmptyState
              icon="bookmark"
              title="No saved items"
              message="Tap the bookmark on any listing to save it here for later."
            />
          );
        }}
      />

      <ListingFilterSheet
        visible={isFilterVisible}
        onClose={() => setFilterVisible(false)}
        sortBy={sortBy}
        onSortChange={setSortBy}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onReset={clearFilters}
      />
    </ThemedSafeAreaView>
  );
}
