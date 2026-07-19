import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { apiClient } from '@/api/client';
import SkeletonCard from '@/components/SkeletonCard';
import EmptyState from '@/components/EmptyState';
import { useSavedStore } from '@/store/savedStore';

type Listing = {
  id: number;
  title: string;
  category?: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
  pickupLocation?: string;
};

export default function SavedListings() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSavedIds = useSavedStore((state) => state.fetchIds);
  const toggleSaved = useSavedStore((state) => state.toggle);

  const fetchSaved = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/saved-listings');
      setListings(response.data);
      fetchSavedIds();
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Could not load your saved items.');
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

    return (
      <View className="relative mx-5 mb-4">
        <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
          <TouchableOpacity
            activeOpacity={0.8}
            className="bg-card border-border flex-row items-center rounded-2xl border p-3 shadow-sm">
            {item.imageUrl ? (
              <Image
                source={{ uri: item.imageUrl }}
                className="h-24 w-24 rounded-xl bg-muted"
                resizeMode="cover"
              />
            ) : (
              <View className="h-24 w-24 items-center justify-center rounded-xl bg-muted">
                <Feather name="image" size={28} color="#94a3b8" />
              </View>
            )}

            <View className="ml-4 flex-1 justify-center self-stretch py-1">
              <Text className="font-sans-bold text-accent text-[10px] tracking-wider uppercase mb-1">
                {displayCategory}
              </Text>
              <Text className="font-sans-bold text-primary mb-1 text-base pr-8" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="font-sans-medium text-muted-foreground mb-2 text-xs" numberOfLines={1}>
                {item.weight} kg • {item.pickupLocation || item.dimensions || 'Specs TBA'}
              </Text>
              <Text className="font-sans-extrabold text-lg text-green-600 mt-auto">
                GHS {totalPrice.toFixed(2)}
              </Text>
              {!isAvailable && (
                <Text className="font-sans-bold text-[10px] text-orange-600 uppercase mt-0.5">
                  No longer available
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </Link>

        <TouchableOpacity
          onPress={() => handleUnsave(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-background/90 border border-border">
          <Feather name="bookmark" size={18} color="#6366f1" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="px-6 py-4 bg-background border-b border-border">
        <Text className="text-2xl font-sans-bold text-primary">Saved Scrap</Text>
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={isLoading || errorMessage ? [] : listings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
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
                onAction={fetchSaved}
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
              icon="bookmark"
              title="No saved items"
              message="Tap the bookmark on any listing to save it here for later."
            />
          );
        }}
      />
    </SafeAreaView>
  );
}
