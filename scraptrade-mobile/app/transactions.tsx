import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

type Order = {
  id: number;
  gatePassCode: string;
  totalAmount: number;
  status: string;
  listing: {
    title: string;
    weight: number;
    category?: string;
  };
};

export default function TransactionsScreen({ isTabRoot = false }: { isTabRoot?: boolean }) {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFactory = role === 'factory';
  const endpoint = isFactory ? '/orders/my-sales' : '/orders/my-orders';

  const fetchOrders = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get(endpoint);
      const sortedOrders = response.data.sort((a: Order, b: Order) => b.id - a.id);
      setOrders(sortedOrders);
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
        bg: 'bg-orange-100',
        text: 'text-orange-700',
        label: isFactory ? 'Awaiting Pickup' : 'Pending Pickup',
        icon: 'clock' as const,
      };
    }
    if (status === 'COMPLETED') {
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'Completed',
        icon: 'check-circle' as const,
      };
    }
    return { bg: 'bg-slate-100', text: 'text-slate-700', label: status, icon: 'file-text' as const };
  };

  const renderTransactionCard = ({ item }: { item: Order }) => {
    const { bg, text, label, icon } = getStatusDisplay(item.status);
    const isPending = item.status === 'PAID_TO_ESCROW';

    const handlePress = () => {
      if (!isFactory && isPending) {
        router.push(
          `/(artisan)/gate-pass?code=${item.gatePassCode}&title=${encodeURIComponent(item.listing.title)}&weight=${item.listing.weight}&amount=${item.totalAmount}`
        );
      }
    };

    return (
      <TouchableOpacity
        activeOpacity={isFactory || !isPending ? 1 : 0.7}
        onPress={handlePress}
        className="bg-card border-border mx-5 mb-4 flex-row items-center rounded-2xl border p-4 shadow-sm">
        <View className={`h-12 w-12 items-center justify-center rounded-full ${bg} mr-4`}>
          <Feather name={icon} size={20} color="#64748b" />
        </View>

        <View className="flex-1 justify-center">
          <Text className="font-sans-bold text-primary mb-1 text-base" numberOfLines={1}>
            {item.listing.title}
          </Text>
          <Text className="font-sans-medium text-muted-foreground text-xs">
            {item.listing.weight} kg • Gate Pass: {item.gatePassCode}
          </Text>
        </View>

        <View className="items-end pl-2">
          <Text className="font-sans-extrabold text-primary mb-1.5 text-base">
            GHS {Number(item.totalAmount).toFixed(2)}
          </Text>
          <View className={`rounded-md px-2 py-1 ${bg}`}>
            <Text className={`font-sans-bold text-[9px] tracking-wider uppercase ${text}`}>
              {label}
            </Text>
          </View>
        </View>

        {!isFactory && isPending && (
          <View className="ml-3">
            <Feather name="chevron-right" size={20} color="#94a3b8" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <View className="bg-background border-border/50 mb-4 flex-row items-center border-b px-5 pt-4 pb-2">
        {!isTabRoot && (
          <TouchableOpacity onPress={() => router.back()} className="mr-4 -ml-2 p-2">
            <Feather name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
        )}
        <Text className="font-sans-extrabold text-primary text-2xl">
          {isFactory ? 'Sales History' : 'Order History'}
        </Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={isLoading || errorMessage ? [] : orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransactionCard}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <View className="px-5">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
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
    </SafeAreaView>
  );
}
