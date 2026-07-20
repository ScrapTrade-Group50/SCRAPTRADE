import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import PageHeader from '@/components/PageHeader';
import SegmentedControl from '@/components/SegmentedControl';
import { buildGatePassHref, formatBuyerLine, formatPickupLine } from '@/utils/gatePassRoute';
import { sortOrdersPendingFirst } from '@/utils/listingSort';

type StatusFilter = 'all' | 'pending' | 'completed';

type Order = {
  id: number;
  gatePassCode: string;
  totalAmount: number;
  status: string;
  buyer?: {
    companyName?: string;
    phoneNumber?: string;
  };
  listing: {
    title: string;
    weight: number;
    category?: string;
    pickupLocation?: string;
    seller?: {
      companyName?: string;
    };
  };
};

export default function TransactionsScreen({ isTabRoot = false }: { isTabRoot?: boolean }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const isFactory = role === 'factory';
  const endpoint = isFactory ? '/orders/my-sales' : '/orders/my-orders';

  const fetchOrders = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get(endpoint);
      setOrders(sortOrdersPendingFirst(response.data as Order[]));
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      setErrorMessage(error.response?.data?.message || 'Could not load your transaction history.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [endpoint])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'PAID_TO_ESCROW') {
      return {
        badgeStyle: theme.accentSoft,
        textStyle: theme.textAccent,
        iconBgStyle: theme.accentSoft,
        label: isFactory ? 'Awaiting Pickup' : 'Pending Pickup',
        icon: 'clock' as const,
        iconColor: colors.accent,
      };
    }
    if (status === 'COMPLETED') {
      return {
        badgeStyle: theme.successSoft,
        textStyle: theme.textSuccess,
        iconBgStyle: theme.successSoft,
        label: 'Completed',
        icon: 'check-circle' as const,
        iconColor: colors.success,
      };
    }
    return {
      badgeStyle: theme.cardMuted,
      textStyle: theme.textMuted,
      iconBgStyle: theme.cardMuted,
      label: status,
      icon: 'file-text' as const,
      iconColor: colors.mutedForeground,
    };
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'pending') {
      return orders.filter((item) => item.status === 'PAID_TO_ESCROW');
    }
    if (statusFilter === 'completed') {
      return orders.filter((item) => item.status === 'COMPLETED');
    }
    return orders;
  }, [orders, statusFilter]);

  const filterOptions: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: isFactory ? 'Awaiting' : 'Pending' },
    { key: 'completed', label: 'Done' },
  ];

  const renderTransactionCard = ({ item }: { item: Order }) => {
    const { badgeStyle, textStyle, iconBgStyle, label, icon, iconColor } = getStatusDisplay(item.status);
    const isPending = item.status === 'PAID_TO_ESCROW';
    const pickupLine = isFactory
      ? item.listing.pickupLocation?.trim() || null
      : formatPickupLine(item.listing.seller?.companyName, item.listing.pickupLocation);
    const buyerLine = isFactory
      ? formatBuyerLine(item.buyer?.companyName, item.buyer?.phoneNumber)
      : null;

    const handlePress = () => {
      if (!isFactory && isPending) {
        router.push(
          buildGatePassHref({
            code: item.gatePassCode,
            title: item.listing.title,
            weight: item.listing.weight,
            amount: item.totalAmount,
            factory: item.listing.seller?.companyName,
            pickup: item.listing.pickupLocation,
          })
        );
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={isFactory || !isPending ? 1 : 0.7}
        onPress={handlePress}
        className="mx-6 mb-3 flex-row items-center rounded-2xl border p-4"
        style={theme.card}>
        <View className="mr-4 h-12 w-12 items-center justify-center rounded-full" style={iconBgStyle}>
          <Feather name={icon} size={20} color={iconColor} />
        </View>

        <View className="flex-1 justify-center">
          <Text className="mb-1 text-base font-sans-bold" style={theme.textPrimary} numberOfLines={1}>
            {item.listing.title}
          </Text>
          {buyerLine ? (
            <Text className="mb-0.5 text-xs font-sans-medium" style={theme.textMuted} numberOfLines={1}>
              Buyer: {buyerLine}
            </Text>
          ) : null}
          {pickupLine ? (
            <Text className="mb-0.5 text-xs font-sans-medium" style={theme.textMuted} numberOfLines={1}>
              {isFactory ? `Pickup: ${pickupLine}` : `From ${pickupLine}`}
            </Text>
          ) : null}
          <Text className="text-xs font-sans-medium" style={theme.textMuted}>
            {item.listing.weight} kg • Gate Pass: {item.gatePassCode}
          </Text>
        </View>

        <View className="items-end pl-2">
          <Text className="mb-1.5 text-base font-sans-extrabold" style={theme.textPrimary}>
            GHS {Number(item.totalAmount).toFixed(2)}
          </Text>
          <View className="rounded-md px-2 py-1" style={badgeStyle}>
            <Text className="text-[9px] font-sans-bold uppercase tracking-wider" style={textStyle}>
              {label}
            </Text>
          </View>
        </View>

        {!isFactory && isPending && (
          <View className="ml-3">
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      {isTabRoot ? (
        <PageHeader
          title={isFactory ? 'Sales History' : 'Order History'}
          subtitle={isFactory ? 'Completed and pending sales' : 'Receipts and gate passes'}
        />
      ) : (
        <ScreenHeader
          title={isFactory ? 'Sales History' : 'Order History'}
          subtitle={isFactory ? 'Completed and pending sales' : 'Receipts and gate passes'}
        />
      )}

      <SegmentedControl options={filterOptions} value={statusFilter} onChange={setStatusFilter} />

      <FlatList
        style={{ flex: 1 }}
        extraData={`${resolved}-${statusFilter}`}
        data={isLoading || errorMessage ? [] : filteredOrders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransactionCard}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
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
                onAction={fetchOrders}
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
          if (statusFilter !== 'all') {
            return (
              <EmptyState
                icon="filter"
                title="No Matching Orders"
                message={`No ${statusFilter === 'pending' ? 'pending' : 'completed'} orders right now.`}
                actionLabel="Show all"
                onAction={() => setStatusFilter('all')}
              />
            );
          }
          return (
            <EmptyState
              icon="file-text"
              title="No Transactions Yet"
              message={
                isFactory
                  ? 'When buyers purchase your materials, sales will appear here.'
                  : 'When you purchase materials, your digital receipts and gate passes will appear here.'
              }
            />
          );
        }}
      />
    </ThemedSafeAreaView>
  );
}
