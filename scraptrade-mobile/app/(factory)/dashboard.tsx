import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert, // <-- Added Alert for the confirmation popup
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { apiClient } from '../../api/client';

type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
};

export default function FactoryDashboard() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchListings = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/listings');
      setListings(response.data);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      setErrorMessage(error.response?.data?.message || error.message || "Could not connect to server");
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

  // --- NEW: The Delete Engine ---
  const handleDelete = (id: number) => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to permanently remove this scrap listing?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Tell Spring Boot to delete it from the database
              await apiClient.delete(`/listings/${id}`);
              
              // 2. Instantly remove it from the phone screen without reloading
              setListings((prevListings) => prevListings.filter(item => item.id !== id));
            } catch (error) {
              console.error("Delete failed:", error);
              Alert.alert("Error", "Could not delete this listing. Please try again.");
            }
          }
        }
      ]
    );
  };

  const activeCount = listings.filter((item) => item.status === 'AVAILABLE').length;
  const pendingCount = listings.filter((item) => item.status === 'PENDING_PICKUP').length;

  const renderInventoryItem = ({ item }: { item: Listing }) => {
    const isAvailable = item.status === 'AVAILABLE';

    return (
      // Changed from TouchableOpacity to View so the Trash button can be tapped independently
      <View className="bg-card border-border mb-4 flex-row items-center rounded-2xl border p-3 shadow-sm">
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            className="h-20 w-20 rounded-xl bg-slate-200"
            resizeMode="cover"
          />
        ) : (
          <View className="h-20 w-20 items-center justify-center rounded-xl bg-slate-200">
            <Feather name="image" size={24} color="#94a3b8" />
          </View>
        )}

        <View className="ml-4 flex-1 justify-center">
          <Text className="font-sans-bold text-muted-foreground mb-1 text-xs">
            MATERIAL • {item.weight} kg
          </Text>
          <Text className="font-sans-bold text-primary mb-1 text-base" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="font-sans-bold text-sm text-green-600">
            GHS {(item.pricePerUnit ?? 0).toFixed(2)}
          </Text>
        </View>

        {/* --- NEW: Right Column with Status & Delete Button --- */}
        <View className="items-end justify-between py-1 ml-2">
          <View className={`rounded-lg px-2 py-1 mb-2 ${isAvailable ? 'bg-green-100' : 'bg-orange-100'}`}>
            <Text className={`font-sans-bold text-[10px] tracking-wider uppercase ${isAvailable ? 'text-green-700' : 'text-orange-600'}`}>
              {isAvailable ? 'Available' : 'Pending'}
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => handleDelete(item.id)} 
            className="p-1 rounded-md bg-red-50"
          >
            <Feather name="trash-2" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="bg-background px-6 py-6">
        <Text className="font-sans-bold text-primary mb-6 text-3xl">Inventory</Text>

        <View className="flex-row gap-4">
          <View className="bg-card border-border flex-1 rounded-2xl border p-5 shadow-sm">
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Feather name="box" size={20} color="#15803d" />
            </View>
            <Text className="font-sans-extrabold text-primary mb-1 text-3xl">{activeCount}</Text>
            <Text className="font-sans-medium text-muted-foreground text-sm">Active Listings</Text>
          </View>

          <View className="bg-card border-border flex-1 rounded-2xl border p-5 shadow-sm">
            <View className="mb-3 h-10 w-10 items-center justify-center rounded-full bg-orange-100">
              <Feather name="truck" size={20} color="#ea580c" />
            </View>
            <Text className="font-sans-extrabold text-primary mb-1 text-3xl">{pendingCount}</Text>
            <Text className="font-sans-medium text-muted-foreground text-sm">Pending Pickups</Text>
          </View>
        </View>
      </View>

      <View style={{ flex: 1 }} className="px-6">
        <Text className="font-sans-bold text-primary mb-4 text-lg">Recent Items</Text>

        {errorMessage ? (
          <View className="bg-red-100 p-4 rounded-xl border border-red-300 mb-4">
            <Text className="text-red-800 font-sans-bold text-sm">Error Loading Data:</Text>
            <Text className="text-red-600 font-sans-medium text-sm mt-1">{errorMessage}</Text>
            <TouchableOpacity onPress={fetchListings} className="mt-3 bg-red-800 px-4 py-2 rounded-lg self-start">
              <Text className="text-white font-sans-bold text-xs">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isLoading ? (
          <View style={{ flex: 1 }} className="items-center justify-center">
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={listings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderInventoryItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }} 
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={{ flex: 1 }} className="items-center justify-center pt-10">
                <Text className="text-muted-foreground font-sans-medium">
                  {errorMessage ? "Cannot display items until error is resolved." : "No items in your inventory."}
                </Text>
              </View>
            }
          />
        )}
      </View>

      <Link href="/(factory)/create-listing" asChild>
        <TouchableOpacity 
          style={{ position: 'absolute', bottom: 32, right: 24, zIndex: 50 }}
          className="bg-accent h-16 w-16 items-center justify-center rounded-full shadow-lg"
        >
          <Feather name="plus" size={32} color="#ffffff" />
        </TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}