import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { apiClient } from '../../api/client';
import { useSavedStore } from '../../store/savedStore';

const { width } = Dimensions.get('window');

// 1. UPDATED: Added description and category to the type
type Listing = {
  id: number;
  title: string;
  description?: string; // <-- Added
  category?: string;    // <-- Added
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
  pickupLocation?: string;
  seller?: {
    companyName: string;
  };
};

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const numericId = Number(id);
  const saved = useSavedStore((state) => state.ids.includes(numericId));
  const toggleSaved = useSavedStore((state) => state.toggle);
  const fetchSavedIds = useSavedStore((state) => state.fetchIds);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const handleToggleSaved = async () => {
    if (!numericId) return;
    try {
      await toggleSaved(numericId);
    } catch {
      Alert.alert('Error', 'Could not update your saved items. Please try again.');
    }
  };

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

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
        {/* Skeleton Back Button */}
        <View className="absolute top-12 left-6 z-10 h-12 w-12 bg-black/10 rounded-full" />
        
        {/* Skeleton Image */}
        <View className="h-80 w-full bg-slate-200 opacity-70" />
        
        <View className="px-6 py-6 opacity-70">
          <View className="flex-row justify-between items-start mb-6">
            <View className="h-6 w-20 bg-slate-200 rounded-lg" />
            <View className="items-end gap-2">
              <View className="h-8 w-32 bg-slate-200 rounded-lg" />
              <View className="h-4 w-24 bg-slate-200 rounded-lg" />
            </View>
          </View>

          <View className="h-10 w-3/4 bg-slate-200 rounded-lg mb-4" />
          <View className="h-5 w-1/2 bg-slate-200 rounded-lg mb-8" />

          <View className="h-px w-full bg-border mb-6" />

          {/* NEW: Skeleton Description */}
          <View className="h-6 w-32 bg-slate-200 rounded-lg mb-3" />
          <View className="h-4 w-full bg-slate-200 rounded-lg mb-2" />
          <View className="h-4 w-5/6 bg-slate-200 rounded-lg mb-8" />

          {/* Skeleton Specs Grid */}
          <View className="h-6 w-32 bg-slate-200 rounded-lg mb-6" />
          <View className="flex-row flex-wrap gap-y-6">
            <View className="w-1/2 pr-4 gap-2">
              <View className="h-4 w-20 bg-slate-200 rounded-lg" />
              <View className="h-6 w-16 bg-slate-200 rounded-lg" />
            </View>
            <View className="w-1/2 pr-4 gap-2">
              <View className="h-4 w-16 bg-slate-200 rounded-lg" />
              <View className="h-6 w-24 bg-slate-200 rounded-lg" />
            </View>
          </View>
        </View>

        {/* Skeleton Bottom Button */}
        <View className="absolute bottom-0 w-full px-6 py-6 bg-background border-t border-border">
           <View className="w-full h-14 bg-slate-200 rounded-xl opacity-70" />
        </View>
      </SafeAreaView>
    );
  }

  if (!listing) return null;

  const totalPrice = (listing.weight * (listing.pricePerUnit || 0)).toFixed(2);
  const factoryDisplayName = listing.seller?.companyName || 'Verified Factory';
  const pickupLocation = listing.pickupLocation || 'Contact factory for pickup details';
  const displayCategory = listing.category ? listing.category.toUpperCase() : "MATERIAL";
  const isAvailable = listing.status === 'AVAILABLE';

  const statusDisplay = {
    AVAILABLE: { label: 'Available', color: 'text-green-600' },
    PENDING_PICKUP: { label: 'Pending Pickup', color: 'text-orange-600' },
    SOLD: { label: 'Sold', color: 'text-slate-500' },
  }[listing.status] ?? { label: listing.status, color: 'text-slate-500' };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      <View className="absolute top-12 left-6 z-10">
        <TouchableOpacity 
          onPress={() => router.back()} 
          className="h-12 w-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-sm"
        >
          <Feather name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-12 right-6 z-10">
        <TouchableOpacity
          onPress={handleToggleSaved}
          className="h-12 w-12 bg-black/40 rounded-full items-center justify-center backdrop-blur-sm"
        >
          <Feather name="bookmark" size={22} color={saved ? '#a5b4fc' : '#ffffff'} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-32" 
        bounces={false}
      >
        
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

        <View className="px-6 py-6">
          <View className="flex-row justify-between items-start mb-2">
            <View className="bg-accent/10 px-3 py-1.5 rounded-lg">
              {/* UPDATED: Dynamic Category Badge */}
              <Text className="text-xs font-sans-bold text-accent tracking-widest uppercase">
                {displayCategory}
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
            <Text className="text-base font-sans-medium text-muted-foreground ml-2 flex-1">
              {factoryDisplayName} • {pickupLocation}
            </Text>
          </View>

          <View className="h-px w-full bg-border mb-6" />

          {/* NEW: Description Section */}
          {listing.description ? (
            <View className="mb-8">
              <Text className="text-lg font-sans-bold text-primary mb-2">Description</Text>
              <Text className="text-base font-sans-medium text-muted-foreground leading-relaxed">
                {listing.description}
              </Text>
            </View>
          ) : null}

          <Text className="text-lg font-sans-bold text-primary mb-4">Specifications</Text>
          
          <View className="flex-row flex-wrap gap-y-6">
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Total Weight</Text>
              <Text className="text-xl font-sans-bold text-primary">{listing.weight} kg</Text>
            </View>
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Status</Text>
              <Text className={`text-xl font-sans-bold ${statusDisplay.color}`}>{statusDisplay.label}</Text>
            </View>
            <View className="w-full">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Dimensions</Text>
              <Text className="text-xl font-sans-bold text-primary">{listing.dimensions || "Not specified"}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      <View className="absolute bottom-0 w-full px-6 py-6 bg-background border-t border-border">
        {isAvailable ? (
          <Link href={`/(artisan)/checkout?id=${listing.id}`} asChild>
            <TouchableOpacity className="w-full items-center rounded-xl bg-primary py-4 shadow-sm flex-row justify-center gap-3">
              <Feather name="shopping-bag" size={20} color="#ffffff" />
              <Text className="text-lg font-sans-bold text-white">Checkout with MoMo</Text>
            </TouchableOpacity>
          </Link>
        ) : (
          <View className="w-full items-center rounded-xl bg-muted py-4 border border-border">
            <Text className="text-lg font-sans-bold text-muted-foreground">Not Available</Text>
          </View>
        )}
      </View>

    </SafeAreaView>
  );
}