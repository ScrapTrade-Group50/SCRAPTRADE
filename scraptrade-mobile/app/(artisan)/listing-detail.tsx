import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { apiClient } from '../../api/client';

const { width } = Dimensions.get('window');

// 1. Define the exact shape of our backend data
type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
  seller?: {
    name: string;
  };
};

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Extract the ID from the previous screen

  // 2. The Data Engine
  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchListingDetail = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        setListing(response.data);
      } catch (error) {
        console.error('Failed to fetch listing details:', error);
        Alert.alert("Error", "Could not load item details. It may have been sold or removed.");
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchListingDetail();
  }, [id]);

  // Loading Screen
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
        <Text className="mt-4 font-sans-medium text-muted-foreground">Loading details...</Text>
      </SafeAreaView>
    );
  }

  // Fallback if data is unexpectedly null
  if (!listing) return null;

  // Calculate the total checkout price
  const totalPrice = (listing.weight * (listing.pricePerUnit || 0)).toFixed(2);
  const factoryDisplayName = listing.seller?.name || "Verified Factory";

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* Absolute Back Button overlaying the carousel */}
      <View className="absolute top-12 left-6 z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="h-12 w-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-sm"
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32" 
        bounces={false}
      >
        
        {/* 1. Header: Image Display */}
        <View className="h-80 w-full bg-slate-200 items-center justify-center">
          {listing.imageUrl ? (
             <Image 
               source={{ uri: listing.imageUrl }}
               style={{ width, height: 320 }}
               resizeMode="cover"
             />
          ) : (
            <Feather name="image" size={48} color="#94a3b8" />
          )}
        </View>

        {/* 2. Body: Details & Typography */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-start mb-2">
            <View className="bg-accent/10 px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-sans-bold text-accent tracking-widest uppercase">
                MATERIAL
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-sans-extrabold text-green-600">GHS {totalPrice}</Text>
              <Text className="text-xs font-sans-medium text-muted-foreground">Total (GHS {listing.pricePerUnit.toFixed(2)}/kg)</Text>
            </View>
          </View>

          <Text className="text-3xl font-sans-bold text-primary mb-2 mt-2">
            {listing.title}
          </Text>

          <View className="flex-row items-center mb-8">
            <Feather name="map-pin" size={16} color="#64748b" />
            <Text className="text-base font-sans-medium text-muted-foreground ml-2">
              {factoryDisplayName} • TBD km
            </Text>
          </View>

          <View className="h-px w-full bg-border mb-6" />

          {/* Specifications Grid */}
          <Text className="text-lg font-sans-bold text-primary mb-4">Specifications</Text>
          
          <View className="flex-row flex-wrap gap-y-6">
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Total Weight</Text>
              <Text className="text-xl font-sans-bold text-primary">{listing.weight} kg</Text>
            </View>
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Status</Text>
              <Text className="text-xl font-sans-bold text-green-600">Available</Text>
            </View>
            <View className="w-full">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Dimensions</Text>
              <Text className="text-xl font-sans-bold text-primary">{listing.dimensions || "Not specified"}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* 3. Action: Sticky Checkout Button */}
      <View className="absolute bottom-0 w-full px-6 py-6 bg-background border-t border-border">
        {/* Pass the ID to the checkout screen so it knows what to buy */}
        <Link href={`/(artisan)/checkout?id=${listing.id}`} asChild>
          <TouchableOpacity className="w-full items-center rounded-xl bg-primary py-4 shadow-sm flex-row justify-center gap-3">
            <Feather name="shopping-bag" size={20} color="#ffffff" />
            <Text className="text-lg font-sans-bold text-white">Checkout with MoMo</Text>
          </TouchableOpacity>
        </Link>
      </View>

    </SafeAreaView>
  );
}