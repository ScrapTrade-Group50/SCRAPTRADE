import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';

// Get screen width for the full-width image carousel
const { width } = Dimensions.get('window');

// Dummy data for the specific listing
const MOCK_LISTING = {
  id: '1',
  category: 'METAL',
  title: 'High-Carbon Steel Off-cuts',
  weight: '120 kg',
  price: '450',
  dimensions: 'Varies: approx. 10cm x 15cm pieces',
  thickness: '5mm - 8mm',
  factoryName: 'Suame Industrial Works',
  distance: '2.5 km away',
  images: [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1504913659239-6abc87875a63?q=80&w=800&auto=format&fit=crop',
  ]
};

export default function ListingDetail() {
  const router = useRouter();

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
        contentContainerClassName="pb-32" // Padding at the bottom so the sticky button doesn't hide content
        bounces={false}
      >
        
        {/* 1. Header: Full-Width Image Carousel */}
        <View className="h-80 w-full bg-card">
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            bounces={false}
          >
            {MOCK_LISTING.images.map((img, index) => (
              <Image 
                key={index}
                source={{ uri: img }}
                style={{ width, height: 320 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          {/* Simple Carousel Indicator */}
          <View className="absolute bottom-4 w-full flex-row justify-center gap-2">
            {MOCK_LISTING.images.map((_, index) => (
              <View key={index} className="h-2 w-2 rounded-full bg-white/80" />
            ))}
          </View>
        </View>

        {/* 2. Body: Details & Typography */}
        <View className="px-6 py-6">
          <View className="flex-row justify-between items-start mb-2">
            <View className="bg-accent/10 px-3 py-1.5 rounded-lg">
              <Text className="text-xs font-sans-bold text-accent tracking-widest uppercase">
                {MOCK_LISTING.category}
              </Text>
            </View>
            <Text className="text-3xl font-sans-extrabold text-green-600">{MOCK_LISTING.price} GHS</Text>
          </View>

          <Text className="text-3xl font-sans-bold text-primary mb-2">
            {MOCK_LISTING.title}
          </Text>

          <View className="flex-row items-center mb-8">
            <Feather name="map-pin" size={16} color="#64748b" />
            <Text className="text-base font-sans-medium text-muted-foreground ml-2">
              {MOCK_LISTING.factoryName} • {MOCK_LISTING.distance}
            </Text>
          </View>

          <View className="h-px w-full bg-border mb-6" />

          {/* Specifications Grid */}
          <Text className="text-lg font-sans-bold text-primary mb-4">Specifications</Text>
          
          <View className="flex-row flex-wrap gap-y-6">
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Total Weight</Text>
              <Text className="text-xl font-sans-bold text-primary">{MOCK_LISTING.weight}</Text>
            </View>
            <View className="w-1/2 pr-4">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Thickness</Text>
              <Text className="text-xl font-sans-bold text-primary">{MOCK_LISTING.thickness}</Text>
            </View>
            <View className="w-full">
              <Text className="text-sm font-sans-medium text-muted-foreground mb-1">Dimensions</Text>
              <Text className="text-xl font-sans-bold text-primary">{MOCK_LISTING.dimensions}</Text>
            </View>
          </View>

        </View>
      </ScrollView>

      {/* 3. Action: Sticky Checkout Button */}
      <View className="absolute bottom-0 w-full px-6 py-6 bg-background border-t border-border">
        {/* We will route this to the MoMo Checkout screen next */}
        <Link href="/checkout" asChild>
          {/* Using primary for the dark high-contrast button like the original slate-900 */}
          <TouchableOpacity className="w-full items-center rounded-xl bg-primary py-4 shadow-sm flex-row justify-center gap-3">
            <Feather name="shopping-bag" size={20} color="#ffffff" />
            <Text className="text-lg font-sans-bold text-white">Checkout with MoMo</Text>
          </TouchableOpacity>
        </Link>
      </View>

    </SafeAreaView>
  );
}