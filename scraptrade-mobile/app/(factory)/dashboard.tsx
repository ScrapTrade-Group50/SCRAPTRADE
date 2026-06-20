import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Image 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

// --- DUMMY DATA FOR FACTORY INVENTORY ---
const MOCK_FACTORY_INVENTORY = [
  {
    id: '1',
    category: 'METAL',
    title: 'High-Carbon Steel Off-cuts',
    weight: '120 kg',
    price: '450 GHS',
    status: 'AVAILABLE',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '2',
    category: 'WOOD',
    title: 'Hardwood Timber Ends (Mahogany)',
    weight: '45 kg',
    price: '180 GHS',
    status: 'PENDING_PICKUP',
    imageUrl: 'https://images.unsplash.com/photo-1610555356070-d1fcb49abeb3?q=80&w=600&auto=format&fit=crop',
  },
  {
    id: '3',
    category: 'TEXTILE',
    title: 'Cotton Canvas Fabric Rolls',
    weight: '15 kg',
    price: '90 GHS',
    status: 'AVAILABLE',
    imageUrl: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=600&auto=format&fit=crop',
  }
];

export default function FactoryDashboard() {

  // Individual Inventory Row Component
  const renderInventoryItem = ({ item }: { item: typeof MOCK_FACTORY_INVENTORY[0] }) => {
    const isAvailable = item.status === 'AVAILABLE';

    return (
      <TouchableOpacity className="flex-row items-center bg-card border border-border rounded-2xl p-3 mb-4 shadow-sm">
        {/* Thumbnail (Left) */}
        <Image 
          source={{ uri: item.imageUrl }} 
          className="h-20 w-20 rounded-xl bg-slate-200"
          resizeMode="cover"
        />
        
        {/* Details (Middle) */}
        <View className="flex-1 ml-4 justify-center">
          <Text className="text-xs font-sans-bold text-muted-foreground mb-1">{item.category} • {item.weight}</Text>
          <Text className="text-base font-sans-bold text-primary mb-1" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="text-sm font-sans-bold text-green-600">{item.price}</Text>
        </View>

        {/* Status Badge (Right) */}
        <View className={`px-3 py-1.5 rounded-lg ml-2 ${isAvailable ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Text className={`text-xs font-sans-bold uppercase tracking-wider ${isAvailable ? 'text-green-700' : 'text-orange-600'}`}>
            {isAvailable ? 'Available' : 'Pending'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      
      {/* HEADER: Quick Stats */}
      <View className="px-6 py-6 bg-background">
        <Text className="text-3xl font-sans-bold text-primary mb-6">Inventory</Text>
        
        <View className="flex-row gap-4">
          <View className="flex-1 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <View className="h-10 w-10 bg-green-100 rounded-full items-center justify-center mb-3">
              <Feather name="box" size={20} color="#15803d" />
            </View>
            <Text className="text-3xl font-sans-extrabold text-primary mb-1">12</Text>
            <Text className="text-sm font-sans-medium text-muted-foreground">Active Listings</Text>
          </View>
          
          <View className="flex-1 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <View className="h-10 w-10 bg-orange-100 rounded-full items-center justify-center mb-3">
              <Feather name="truck" size={20} color="#ea580c" />
            </View>
            <Text className="text-3xl font-sans-extrabold text-primary mb-1">3</Text>
            <Text className="text-sm font-sans-medium text-muted-foreground">Pending Pickups</Text>
          </View>
        </View>
      </View>

      {/* BODY: Inventory List View */}
      <View className="flex-1 px-6">
        <Text className="text-lg font-sans-bold text-primary mb-4">Recent Items</Text>
        <FlatList
          data={MOCK_FACTORY_INVENTORY}
          keyExtractor={(item) => item.id}
          renderItem={renderInventoryItem}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-24" // Extra padding for the FAB
        />
      </View>

      {/* ACTION: Floating Action Button (FAB) */}
      <Link href="/create-listing" asChild>
        <TouchableOpacity className="absolute bottom-8 right-6 h-16 w-16 bg-accent rounded-full items-center justify-center shadow-lg">
          <Feather name="plus" size={32} color="#ffffff" />
        </TouchableOpacity>
      </Link>

    </SafeAreaView>
  );
}