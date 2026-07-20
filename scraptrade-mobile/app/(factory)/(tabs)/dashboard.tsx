import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import NotificationBell from '@/components/NotificationBell';
import PageHeader from '@/components/PageHeader';
import SegmentedControl from '@/components/SegmentedControl';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { ROUTES } from '@/utils/routes';
import { formatBuyerLine } from '@/utils/gatePassRoute';
import { showConfirm, showErrorNotice } from '@/utils/alert';
import { inventoryWithoutPending, type ListingCard } from '@/utils/listingSort';

type Listing = ListingCard;

type PendingSale = {
  id: number;
  status: string;
  buyer?: {
    companyName?: string;
    phoneNumber?: string;
  };
  listing?: {
    id?: number;
  };
};

type InventoryFilter = 'all' | 'available' | 'sold';

const METRIC_LABELS: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  sold: 'Sold',
  revenue: 'Revenue',
};

export default function FactoryDashboard() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors, resolved } = theme;

  const [listings, setListings] = useState<Listing[]>([]);
  const [pendingBuyers, setPendingBuyers] = useState<Map<number, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [inventoryFilter, setInventoryFilter] = useState<InventoryFilter>('all');
  const [inventorySearch, setInventorySearch] = useState('');

  const fetchListings = async () => {
    setErrorMessage(null);
    try {
      const [listingsRes, salesRes] = await Promise.all([
        apiClient.get('/listings/mine'),
        apiClient.get('/orders/my-sales'),
      ]);
      setListings(listingsRes.data);

      const buyerByListing = new Map<number, string>();
      for (const order of salesRes.data as PendingSale[]) {
        if (order.listing?.id && order.status !== 'CANCELLED') {
          const buyerLine = formatBuyerLine(order.buyer?.companyName, order.buyer?.phoneNumber);
          if (buyerLine) {
            buyerByListing.set(order.listing.id, buyerLine);
          }
        }
      }
      setPendingBuyers(buyerByListing);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      setErrorMessage(error.response?.data?.message || error.message || 'Could not connect to server');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const handleDelete = (id: number) => {
    showConfirm(
      'Delete Listing',
      'Are you sure you want to permanently remove this scrap listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/listings/${id}`);
              setListings((prevListings) => prevListings.filter((item) => item.id !== id));
            } catch (error) {
              console.error('Delete failed:', error);
              showErrorNotice('Error', 'Could not delete this listing. Please try again.');
            }
          },
        },
      ]
    );
  };

  const activeCount = listings.filter((item) => item.status === 'AVAILABLE').length;
  const pendingListings = useMemo(
    () => listings.filter((item) => item.status === 'PENDING_PICKUP').sort((a, b) => b.id - a.id),
    [listings]
  );
  const pendingCount = pendingListings.length;
  const inventoryListings = useMemo(() => inventoryWithoutPending(listings), [listings]);

  const filteredInventory = useMemo(() => {
    const q = inventorySearch.trim().toLowerCase();
    return inventoryListings.filter((item) => {
      const matchesFilter =
        inventoryFilter === 'all' ||
        (inventoryFilter === 'available' && item.status === 'AVAILABLE') ||
        (inventoryFilter === 'sold' && item.status === 'SOLD');
      if (!matchesFilter) return false;
      if (!q) return true;
      const buyer = pendingBuyers.get(item.id);
      return (
        item.title.toLowerCase().includes(q) ||
        (item.category?.toLowerCase().includes(q) ?? false) ||
        (item.pickupLocation?.toLowerCase().includes(q) ?? false) ||
        (buyer?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [inventoryListings, inventoryFilter, inventorySearch, pendingBuyers]);

  const soldListings = listings.filter((item) => item.status === 'SOLD');
  const soldCount = soldListings.length;
  const totalRevenue = soldListings.reduce(
    (sum, item) => sum + item.pricePerUnit * item.weight,
    0
  );

  const metrics = [
    { key: 'active', value: String(activeCount) },
    { key: 'pending', value: String(pendingCount) },
    { key: 'sold', value: String(soldCount) },
    {
      key: 'revenue',
      value:
        totalRevenue >= 10000
          ? `${(totalRevenue / 1000).toFixed(1)}k`
          : Math.round(totalRevenue).toLocaleString('en-US'),
    },
  ];

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return { badgeStyle: theme.successSoft, textStyle: theme.textSuccess, label: 'Available' };
      case 'PENDING_PICKUP':
        return { badgeStyle: theme.accentSoft, textStyle: theme.textAccent, label: 'Pending Pickup' };
      case 'SOLD':
        return { badgeStyle: theme.cardMuted, textStyle: theme.textMuted, label: 'Sold & Scanned' };
      default:
        return { badgeStyle: theme.cardMuted, textStyle: theme.textMuted, label: status };
    }
  };

  const renderInventoryItem = ({ item }: { item: Listing }) => {
    const { badgeStyle, textStyle, label } = getStatusDisplay(item.status);
    const displayCategory = item.category ? item.category.toUpperCase() : 'MATERIAL';
    const buyerLine = pendingBuyers.get(item.id);

    return (
      <View className="mb-3 flex-row items-center rounded-2xl border p-3" style={theme.card}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="h-20 w-20 rounded-xl"
            style={theme.cardMuted}
            resizeMode="cover"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-xl" style={theme.cardMuted}>
            <Feather name="image" size={24} color={colors.mutedForeground} />
          </View>
        )}

        <View className="ml-4 flex-1 justify-center">
          <Text className="mb-1 text-xs font-sans-bold" style={theme.textMuted}>
            {displayCategory} • {item.weight} kg
          </Text>
          <Text className="mb-1 text-base font-sans-bold" style={theme.textPrimary} numberOfLines={1}>
            {item.title}
          </Text>
          {buyerLine ? (
            <Text className="mb-0.5 text-xs font-sans-semibold" style={theme.textAccent} numberOfLines={1}>
              Buyer: {buyerLine}
            </Text>
          ) : null}
          <Text className="text-sm font-sans-bold" style={theme.textSuccess}>
            GHS {(item.pricePerUnit ?? 0).toFixed(2)}/kg
          </Text>
        </View>

        <View className="ml-2 items-end">
          <View className="mb-2 rounded-lg px-2 py-1" style={badgeStyle}>
            <Text className="text-[10px] font-sans-bold uppercase tracking-wider" style={textStyle}>
              {label}
            </Text>
          </View>

          {item.status === 'AVAILABLE' ? (
            <View className="mt-1 flex-row gap-1">
              <TouchableOpacity
                onPress={() => router.push(`/(factory)/edit-listing?id=${item.id}`)}
                className="rounded-md p-1.5"
                style={theme.accentSoft}>
                <Feather name="edit-2" size={16} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(item.id)}
                className="rounded-md p-1.5"
                style={{ backgroundColor: `${colors.destructive}1A` }}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          ) : (
            <View className="h-8" />
          )}
        </View>
      </View>
    );
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <PageHeader
        title="Dashboard"
        subtitle="Your factory inventory"
        right={<NotificationBell />}
      />

      <View className="px-6 pb-2">
        <View className="flex-row overflow-hidden rounded-xl border" style={theme.card}>
          {metrics.map((metric, index) => (
            <View
              key={metric.key}
              className="flex-1 items-center py-2"
              style={
                index > 0 ? { borderLeftWidth: 1, borderLeftColor: colors.border } : undefined
              }>
              <Text className="text-sm font-sans-extrabold" style={theme.textPrimary}>
                {metric.value}
              </Text>
              <Text className="mt-0.5 text-[10px] font-sans-semibold" style={theme.textMuted}>
                {METRIC_LABELS[metric.key]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {pendingCount > 0 && (
        <View className="px-6 pb-2 pt-2">
          <Text className="mb-2 text-xs font-sans-bold uppercase tracking-wider" style={theme.sectionLabel}>
            Pending pickup
          </Text>
          {pendingListings.map((item) => {
            const buyerLine = pendingBuyers.get(item.id);
            return (
              <View
                key={item.id}
                className="mb-1.5 flex-row items-center rounded-xl border px-2.5 py-2"
                style={{ ...theme.accentSoft, borderColor: `${colors.accent}40` }}>
                <Feather name="clock" size={14} color={colors.accent} style={{ marginRight: 8 }} />
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-sans-bold" style={theme.textPrimary} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text className="text-[11px] font-sans-medium" style={theme.textMuted} numberOfLines={1}>
                    {buyerLine ? `${buyerLine} • ` : ''}
                    {item.weight} kg
                  </Text>
                </View>
                <Link href={ROUTES.factoryScanner} asChild>
                  <TouchableOpacity className="ml-2 rounded-lg px-2.5 py-1.5" style={theme.accentFill}>
                    <Text className="text-[11px] font-sans-bold" style={theme.textOnAccent}>
                      Scan
                    </Text>
                  </TouchableOpacity>
                </Link>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ flex: 1 }} className="px-6 pt-4">
        <Text className="mb-3" style={theme.type.sectionTitle}>
          Inventory List
        </Text>

        <View
          className="mb-3 h-12 flex-row items-center rounded-2xl border px-4"
          style={theme.inputSurface}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
          <TextInput
            className="ml-2 flex-1 text-sm font-sans-medium"
            style={theme.textPrimary}
            placeholder="Search listings or buyers..."
            placeholderTextColor={colors.mutedForeground}
            value={inventorySearch}
            onChangeText={setInventorySearch}
          />
        </View>

        <SegmentedControl
          style={{ marginHorizontal: 0, marginBottom: 12 }}
          options={[
            { key: 'all' as const, label: 'All' },
            { key: 'available' as const, label: 'Available' },
            { key: 'sold' as const, label: 'Sold' },
          ]}
          value={inventoryFilter}
          onChange={setInventoryFilter}
        />

        {errorMessage ? (
          <EmptyState
            icon="alert-triangle"
            title="Data Error"
            message={errorMessage}
            actionLabel="Try Again"
            onAction={fetchListings}
          />
        ) : isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ScrollView>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            extraData={`${resolved}-${inventoryFilter}-${inventorySearch}`}
            data={filteredInventory}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderInventoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            ListEmptyComponent={
              <EmptyState
                icon="package"
                title={inventoryFilter !== 'all' || inventorySearch ? 'No Matching Items' : 'No Inventory Yet'}
                message={
                  inventoryFilter !== 'all' || inventorySearch
                    ? 'Try a different filter or search term.'
                    : "You haven't posted any scrap materials. Tap the + button to create your first listing."
                }
              />
            }
          />
        )}
      </View>

      <Link href="/(factory)/create-listing" asChild>
        <TouchableOpacity
          className="h-16 w-16 items-center justify-center rounded-full"
          style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 50, ...theme.accentFill }}>
          <Feather name="plus" size={32} color={colors.onAccent} />
        </TouchableOpacity>
      </Link>
    </ThemedSafeAreaView>
  );
}
