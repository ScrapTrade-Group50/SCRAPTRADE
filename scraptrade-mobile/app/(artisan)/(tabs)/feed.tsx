import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Modal,
  Pressable,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Link, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';

type Listing = {
  id: number;
  title: string;
  category?: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
};

export default function ArtisanFeed() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState(500);

  const fetchListings = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/listings');
      const availableItems = response.data.filter((item: Listing) => item.status === 'AVAILABLE');
      setListings(availableItems);
    } catch (error: any) {
      console.error('Failed to fetch feed:', error);
      setErrorMessage(error.response?.data?.message || 'Could not connect to server');
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

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

      const matchesCategory =
        !selectedCategory || item.category?.toUpperCase() === selectedCategory;

      const totalPrice = (item.pricePerUnit ?? 0) * (item.weight ?? 0);
      const matchesPrice = totalPrice <= maxPrice;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [listings, searchQuery, selectedCategory, maxPrice]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  const renderScrapCard = ({ item }: { item: Listing }) => {
    const displayCategory = item.category ? item.category.toUpperCase() : 'MATERIAL';
    const totalPrice = (item.pricePerUnit ?? 0) * (item.weight ?? 0);

    return (
      <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-card border-border mb-4 flex-row items-center rounded-2xl border p-3 shadow-sm mx-5">
          <View className="relative">
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
          </View>

          <View className="ml-4 flex-1 justify-center self-stretch py-1">
            <View className="flex-row items-center justify-between mb-1">
              <Text className="font-sans-bold text-accent text-[10px] tracking-wider uppercase">
                {displayCategory}
              </Text>
              <Feather name="bookmark" size={16} color="#cbd5e1" />
            </View>

            <Text className="font-sans-bold text-primary mb-1 text-base" numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="font-sans-medium text-muted-foreground mb-2 text-xs" numberOfLines={1}>
              {item.weight} kg • {item.dimensions || 'Specs TBA'}
            </Text>

            <Text className="font-sans-extrabold text-lg text-green-600 mt-auto">
              GHS {totalPrice.toFixed(2)}
            </Text>
            <Text className="font-sans-medium text-muted-foreground text-[10px]">
              GHS {(item.pricePerUnit ?? 0).toFixed(2)}/kg
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  const FeedHeader = () => (
    <View className="px-5 pt-4 pb-4 bg-background z-10">
      <Text className="text-2xl font-sans-extrabold text-primary mb-4">Discover Materials</Text>

      <View className="flex-row gap-3">
        <View className="flex-1 flex-row items-center bg-card border border-border rounded-2xl px-4 h-14 shadow-sm">
          <Feather name="search" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-3 text-base font-sans-medium text-primary h-full"
            placeholder="Search off-cuts..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setFilterVisible(true)}
          className="w-14 h-14 bg-accent items-center justify-center rounded-2xl shadow-sm">
          <Feather name="sliders" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <FeedHeader />

      <FlatList
        style={{ flex: 1 }}
        data={isLoading || errorMessage ? [] : filteredListings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderScrapCard}
        contentContainerStyle={{ paddingBottom: 100, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
          return (
            <EmptyState
              icon="inbox"
              title="No Materials Found"
              message="There are no materials matching your search. Try adjusting your filters."
              actionLabel="Refresh Feed"
              onAction={fetchListings}
            />
          );
        }}
      />

      <Modal
        animationType="slide"
        transparent
        visible={isFilterVisible}
        onRequestClose={() => setFilterVisible(false)}>
        <View className="flex-1 justify-end bg-black/50">
          <Pressable className="absolute inset-0" onPress={() => setFilterVisible(false)} />

          <View className="bg-background h-[80%] rounded-t-[32px] mt-auto shadow-2xl">
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-border rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
              <Text className="text-2xl font-sans-bold text-primary">Filters</Text>
              <TouchableOpacity
                onPress={() => setFilterVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Feather name="x" size={20} color="#081126" />
              </TouchableOpacity>
            </View>

            <View className="px-6 py-6 flex-1 gap-8">
              <View>
                <Text className="text-base font-sans-bold text-primary mb-4">Material Category</Text>
                <View className="flex-row flex-wrap gap-3">
                  {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                      className={`px-6 py-3 rounded-2xl border-2 ${
                        selectedCategory === cat ? 'border-accent bg-accent/10' : 'border-border bg-card'
                      }`}>
                      <Text
                        className={`font-sans-bold ${selectedCategory === cat ? 'text-accent' : 'text-muted-foreground'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-sans-bold text-primary">Max Total Price (GHS)</Text>
                  <Text className="text-lg font-sans-bold text-accent">{maxPrice} GHS</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={10}
                  maximumValue={5000}
                  step={10}
                  value={maxPrice}
                  onValueChange={setMaxPrice}
                  minimumTrackTintColor="#ea7a53"
                  maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
                  thumbTintColor="#ea7a53"
                />
              </View>
            </View>

            <View className="px-6 pb-10 pt-4 border-t border-border bg-card">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFilterVisible(false)}
                className="w-full items-center justify-center rounded-2xl bg-accent h-14 shadow-sm">
                <Text className="text-lg font-sans-bold text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
