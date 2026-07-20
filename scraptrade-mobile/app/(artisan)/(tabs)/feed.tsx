import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Link, useFocusEffect } from 'expo-router';
import { apiClient } from '@/api/client';
import { getApiErrorMessage } from '@/utils/apiErrors';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import NotificationBell from '@/components/NotificationBell';
import PageHeader from '@/components/PageHeader';
import SearchFilterBar from '@/components/SearchFilterBar';
import ListingFilterSheet, {
  type ListingCategoryFilter,
  type ListingSortKey,
} from '@/components/ListingFilterSheet';
import { useSavedStore } from '@/store/savedStore';
import { matchesListingSearch, type ListingCard } from '@/utils/listingSort';

type Listing = ListingCard;

const PRICE_LIMIT = 5000;

export default function ArtisanFeed() {
  const theme = useScreenTheme();
  const { colors, resolved } = theme;

  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [maxPrice, setMaxPrice] = useState(PRICE_LIMIT);
  const [sortBy, setSortBy] = useState<ListingSortKey>('newest');
  const [categoryFilter, setCategoryFilter] = useState<ListingCategoryFilter>('ALL');

  const savedIds = useSavedStore((state) => state.ids);
  const fetchSavedIds = useSavedStore((state) => state.fetchIds);
  const toggleSaved = useSavedStore((state) => state.toggle);

  const fetchListings = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/listings');
      const availableItems = response.data.filter((item: Listing) => item.status === 'AVAILABLE');
      setListings(availableItems);
    } catch (error: unknown) {
      console.error('Failed to fetch feed:', error);
      setErrorMessage(getApiErrorMessage(error, 'Could not connect to server'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListings();
      fetchSavedIds();
    }, [fetchSavedIds])
  );

  const handleToggleSaved = async (listingId: number) => {
    try {
      await toggleSaved(listingId);
    } catch {
      // Optimistic store already rolled back; ignore.
    }
  };

  const filteredListings = useMemo(() => {
    const totalOf = (item: Listing) => (item.pricePerUnit ?? 0) * (item.weight ?? 0);

    const filtered = listings.filter((item) => {
      const matchesSearch = matchesListingSearch(item, searchQuery);
      const matchesCategory =
        categoryFilter === 'ALL' || item.category?.toUpperCase() === categoryFilter;
      const matchesPrice = maxPrice >= PRICE_LIMIT || totalOf(item) <= maxPrice;
      return matchesSearch && matchesCategory && matchesPrice;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'price_asc') return totalOf(a) - totalOf(b);
      if (sortBy === 'price_desc') return totalOf(b) - totalOf(a);
      return b.id - a.id;
    });
  }, [listings, searchQuery, categoryFilter, maxPrice, sortBy]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const hasActiveFilters =
    categoryFilter !== 'ALL' || maxPrice < PRICE_LIMIT || sortBy !== 'newest';

  const clearFilters = () => {
    setCategoryFilter('ALL');
    setMaxPrice(PRICE_LIMIT);
    setSortBy('newest');
  };

  const renderScrapCard = ({ item }: { item: Listing }) => {
    const displayCategory = item.category ? item.category.toUpperCase() : 'MATERIAL';
    const totalPrice = (item.pricePerUnit ?? 0) * (item.weight ?? 0);
    const saved = savedIds.includes(item.id);
    const sellerName = item.seller?.companyName?.trim();
    const pickupLine = item.pickupLocation?.trim();

    return (
      <View className="relative mx-5 mb-3">
        <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
          <TouchableOpacity
            activeOpacity={0.85}
            className="flex-row items-center rounded-2xl border p-3"
            style={theme.card}>
            <View className="relative">
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
            </View>

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
              <Text className="text-[10px] font-sans-medium" style={theme.textMuted}>
                GHS {(item.pricePerUnit ?? 0).toFixed(2)}/kg
              </Text>
            </View>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          onPress={() => handleToggleSaved(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: `${colors.background}E6`, borderColor: colors.border }}>
          <Feather
            name="bookmark"
            size={18}
            color={saved ? colors.accent : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const FeedHeader = () => (
    <View className="z-10 pb-2">
      <PageHeader
        title="Discover"
        subtitle="Verified factory off-cuts"
        right={<NotificationBell />}
      />

      <SearchFilterBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search title, factory, location..."
        onFilterPress={() => setFilterVisible(true)}
        filtersActive={hasActiveFilters}
      />
    </View>
  );

  return (
    <ThemedSafeAreaView edges={['top']}>
      <FeedHeader />

      <FlatList
        style={{ flex: 1 }}
        extraData={`${resolved}-${sortBy}-${categoryFilter}-${maxPrice}`}
        data={isLoading || errorMessage ? [] : filteredListings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderScrapCard}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
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
                title="Connection Error"
                message={errorMessage}
                actionLabel="Try Again"
                onAction={fetchListings}
              />
            );
          }
          if (isLoading) {
            return (
              <View className="px-5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            );
          }
          if (hasActiveFilters || searchQuery) {
            return (
              <EmptyState
                icon="filter"
                title="No Materials Found"
                message="Nothing matches your search or filters."
                actionLabel="Clear filters"
                onAction={() => {
                  clearFilters();
                  setSearchQuery('');
                }}
              />
            );
          }
          return (
            <EmptyState
              icon="inbox"
              title="No Materials Found"
              message="There are no available materials right now."
              actionLabel="Refresh Feed"
              onAction={fetchListings}
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
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
        priceLimit={PRICE_LIMIT}
        onReset={clearFilters}
      />
    </ThemedSafeAreaView>
  );
}
