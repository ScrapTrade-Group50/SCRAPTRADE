import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons'; 
import Slider from '@react-native-community/slider';
import { Link } from 'expo-router';
import { apiClient } from '../../api/client'; // <-- Imported your API Client

// 1. Defined the REAL backend data structure
type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
};

export default function ArtisanFeed() {
  // 2. State Engine for live data
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter Modal States
  const [isFilterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>('METAL');
  const [maxPrice, setMaxPrice] = useState(500);
  const [maxDistance, setMaxDistance] = useState(15);

  // 3. The Fetch Function
  const fetchListings = async () => {
    setErrorMessage(null);
    try {
      // Fetch ONLY available listings from the database
      const response = await apiClient.get('/listings');
      // Filter out anything that isn't explicitly AVAILABLE just to be safe
      const availableItems = response.data.filter((item: Listing) => item.status === 'AVAILABLE');
      setListings(availableItems);
    } catch (error: any) {
      console.error('Failed to fetch feed:', error);
      setErrorMessage(error.response?.data?.message || "Could not connect to server");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

  // 4. Mapped the card to use the real 'item' fields
  const renderScrapCard = ({ item }: { item: Listing }) => (
    <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild>
      <TouchableOpacity 
        activeOpacity={0.9} 
        className="bg-card rounded-[28px] mb-6 shadow-sm border border-border overflow-hidden"
      >
        <View className="relative">
          {item.imageUrl ? (
            <Image 
              source={{ uri: item.imageUrl }} 
              className="w-full h-52 bg-muted"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-52 bg-slate-200 items-center justify-center">
              <Feather name="image" size={40} color="#94a3b8" />
            </View>
          )}
          
          <View className="absolute top-4 left-4 bg-accent px-3 py-1.5 rounded-full shadow-sm">
            <Text className="text-white text-xs font-sans-bold tracking-widest uppercase">
              MATERIAL
            </Text>
          </View>

          <TouchableOpacity className="absolute top-4 right-4 bg-card/90 p-2.5 rounded-full shadow-sm">
            <Feather name="bookmark" size={18} color="#081126" />
          </TouchableOpacity>
        </View>
        
        <View className="p-5">
          <Text className="text-xl font-sans-bold text-primary mb-1.5" numberOfLines={1}>
            {item.title}
          </Text>

          {item.dimensions ? (
            <View className="flex-row items-center mb-5">
              <Feather name="maximize" size={14} color="#64748b" />
              <Text className="text-sm font-sans-medium text-muted-foreground ml-1.5">
                {item.dimensions}
              </Text>
            </View>
          ) : <View className="h-4 mb-5" /> /* Spacer if no dimensions */}

          <View className="flex-row justify-between items-center pt-4 border-t border-border">
            <View>
              <Text className="text-xs font-sans-medium text-muted-foreground mb-1 uppercase tracking-wider">Weight</Text>
              <Text className="text-lg font-sans-bold text-primary">{item.weight} kg</Text>
            </View>
            <View className="items-end">
              <Text className="text-xs font-sans-medium text-muted-foreground mb-1 uppercase tracking-wider">Price</Text>
              <Text className="text-2xl font-sans-extrabold text-green-600">GHS {(item.pricePerUnit ?? 0).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-background" edges={['top']}>
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

      {/* BODY: Live Data List */}
      {errorMessage ? (
        <View className="px-5 mt-4">
          <View className="bg-red-100 p-4 rounded-xl border border-red-300">
            <Text className="text-red-800 font-sans-bold text-sm">Connection Error:</Text>
            <Text className="text-red-600 font-sans-medium text-sm mt-1">{errorMessage}</Text>
            <TouchableOpacity onPress={fetchListings} className="mt-3 bg-red-800 px-4 py-2 rounded-lg self-start">
              <Text className="text-white font-sans-bold text-xs">Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ea7a53" />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={listings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderScrapCard}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Feather name="inbox" size={48} color="#cbd5e1" />
              <Text className="text-muted-foreground font-sans-medium mt-4 text-center">
                No materials available right now.{"\n"}Pull down to refresh.
              </Text>
            </View>
          }
        />
      )}

      {/* MODAL: Advanced Filters */}
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

            <View className="px-6 py-6 flex-1 gap-8">
              <View>
                <Text className="text-base font-sans-bold text-primary mb-4">Material Category</Text>
                <View className="flex-row flex-wrap gap-3">
                  {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setSelectedCategory(cat)}
                      className={`px-6 py-3 rounded-2xl border-2 ${
                        selectedCategory === cat ? 'border-accent bg-accent/10' : 'border-border bg-card'
                      }`}
                    >
                      <Text className={`font-sans-bold ${selectedCategory === cat ? 'text-accent' : 'text-muted-foreground'}`}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

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
            </View>

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