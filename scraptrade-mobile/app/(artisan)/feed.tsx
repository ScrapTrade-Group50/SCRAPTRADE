import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image,
  Modal,
  Pressable,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons'; 
import Slider from '@react-native-community/slider';
// 1. Added the Link import here!
import { Link } from 'expo-router';

// --- DUMMY DATA FOR UI TESTING ---
const MOCK_SCRAP_DATA = [
  {
    id: '1',
    category: 'METAL',
    title: 'High-Carbon Steel Off-cuts',
    weight: '120 kg',
    price: '450 GHS',
    distance: '2.5 km',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    category: 'WOOD',
    title: 'Hardwood Timber (Mahogany)',
    weight: '45 kg',
    price: '180 GHS',
    distance: '5.1 km',
    imageUrl: 'https://images.unsplash.com/photo-1610555356070-d1fcb49abeb3?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '3',
    category: 'TEXTILE',
    title: 'Cotton Canvas Fabric Rolls',
    weight: '15 kg',
    price: '90 GHS',
    distance: '1.2 km',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
  }
];

export default function ArtisanFeed() {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Modal States
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('METAL');
  const [maxPrice, setMaxPrice] = useState(500);
  const [maxDistance, setMaxDistance] = useState(15);

  // Individual Listing Card Component
  const renderScrapCard = ({ item }: { item: typeof MOCK_SCRAP_DATA[0] }) => (
    // 2. Wrapped the TouchableOpacity in a Link component pointing to the detail page
    <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
      <TouchableOpacity 
        activeOpacity={0.9} 
        className="bg-card rounded-[28px] mb-6 shadow-sm border border-border overflow-hidden"
      >
        {/* Image & Floating Badges */}
        <View className="relative">
          <Image 
            source={{ uri: item.imageUrl }} 
            className="w-full h-52 bg-muted"
            resizeMode="cover"
          />
          
          {/* Floating Category Badge */}
          <View className="absolute top-4 left-4 bg-accent px-3 py-1.5 rounded-full shadow-sm">
            <Text className="text-white text-xs font-sans-bold tracking-widest uppercase">
              {item.category}
            </Text>
          </View>

          {/* Save/Bookmark Button */}
          <TouchableOpacity 
            className="absolute top-4 right-4 bg-card/90 p-2.5 rounded-full shadow-sm"
          >
            <Feather name="bookmark" size={18} color="#081126" />
          </TouchableOpacity>
        </View>
        
        {/* Card Content */}
        <View className="p-5">
          <Text className="text-xl font-sans-bold text-primary mb-1.5" numberOfLines={1}>
            {item.title}
          </Text>

          <View className="flex-row items-center mb-5">
            <Feather name="map-pin" size={14} color="#64748b" />
            <Text className="text-sm font-sans-medium text-muted-foreground ml-1.5">
              {item.distance} away
            </Text>
          </View>

          {/* Pricing & Weight Footer */}
          <View className="flex-row justify-between items-center pt-4 border-t border-border">
            <View>
              <Text className="text-xs font-sans-medium text-muted-foreground mb-1 uppercase tracking-wider">Weight</Text>
              <Text className="text-lg font-sans-bold text-primary">{item.weight}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-sans-medium text-muted-foreground mb-1 uppercase tracking-wider">Price</Text>
              <Text className="text-2xl font-sans-extrabold text-success">{item.price}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      {/* HEADER: Title & Search */}
      <View className="px-5 pt-4 pb-4 bg-background z-10">
        <Text className="text-2xl font-sans-extrabold text-primary mb-4">
          Discover Materials
        </Text>
        
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
            className="w-14 h-14 bg-accent items-center justify-center rounded-2xl shadow-sm"
          >
            <Feather name="sliders" size={22} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BODY: Vertical Scrolling List */}
      <FlatList
        data={MOCK_SCRAP_DATA}
        keyExtractor={(item) => item.id}
        renderItem={renderScrapCard}
        contentContainerClassName="p-5 pb-24"
        showsVerticalScrollIndicator={false}
      />

      {/* MODAL: Advanced Filters (Bottom Sheet Style) */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterVisible}
        onRequestClose={() => setFilterVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="absolute inset-0" 
            onPress={() => setFilterVisible(false)} 
          />
          
          <View className="bg-background h-[80%] rounded-t-[32px] mt-auto shadow-2xl">
            
            {/* Modal Header & Drag Indicator */}
            <View className="items-center pt-3 pb-2">
              <View className="w-12 h-1.5 bg-border rounded-full" />
            </View>

            <View className="flex-row justify-between items-center px-6 py-4 border-b border-border">
              <Text className="text-2xl font-sans-bold text-primary">Filters</Text>
              <TouchableOpacity 
                onPress={() => setFilterVisible(false)} 
                className="h-10 w-10 items-center justify-center rounded-full bg-muted"
              >
                <Feather name="x" size={20} color="#081126" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            <View className="px-6 py-6 flex-1 gap-8">
              
              {/* Category Chips */}
              <View>
                <Text className="text-base font-sans-bold text-primary mb-4">Material Category</Text>
                <View className="flex-row flex-wrap gap-3">
                  {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`px-6 py-3 rounded-2xl border-2 ${
                        selectedCategory === cat 
                          ? 'border-accent bg-accent/10' 
                          : 'border-border bg-card'
                      }`}
                    >
                      <Text className={`font-sans-bold ${
                        selectedCategory === cat ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Slider */}
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-sans-bold text-primary">Max Price (per kg)</Text>
                  <Text className="text-lg font-sans-bold text-accent">{maxPrice} GHS</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={10}
                  maximumValue={1000}
                  step={10}
                  value={maxPrice}
                  onValueChange={setMaxPrice}
                  minimumTrackTintColor="#ea7a53" 
                  maximumTrackTintColor="rgba(0, 0, 0, 0.1)" 
                  thumbTintColor="#ea7a53"
                />
              </View>

              {/* Distance Slider */}
              <View>
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-sans-bold text-primary">Proximity</Text>
                  <Text className="text-lg font-sans-bold text-accent">Within {maxDistance} km</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  minimumTrackTintColor="#ea7a53"
                  maximumTrackTintColor="rgba(0, 0, 0, 0.1)"
                  thumbTintColor="#ea7a53"
                />
              </View>

            </View>

            {/* Modal Footer */}
            <View className="px-6 pb-10 pt-4 border-t border-border bg-card">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setFilterVisible(false)}
                className="w-full items-center justify-center rounded-2xl bg-accent h-14 shadow-sm"
              >
                <Text className="text-lg font-sans-bold text-white">Apply Filters</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}