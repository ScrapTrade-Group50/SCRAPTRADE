import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  Alert,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router'; // <-- Added useFocusEffect
import { apiClient } from '../../api/client';
import SkeletonCard from '../../components/SkeletonCard'; 
import EmptyState from '../../components/EmptyState'; 

type Listing = {
  id: number;
  title: string;
  category?: string; // Pulled from our recent backend update
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
      const response = await apiClient.get('/listings/mine');
      setListings(response.data);
    } catch (error: any) {
      console.error('Failed to fetch listings:', error);
      setErrorMessage(error.response?.data?.message || error.message || "Could not connect to server");
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // --- THE MAGIC FIX: useFocusEffect ---
  // This triggers the fetch every time you navigate back to this screen!
  useFocusEffect(
    useCallback(() => {
      fetchListings();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchListings();
  };

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
              await apiClient.delete(`/listings/${id}`);
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

  // --- COMPACT DASHBOARD METRICS ---
  const activeCount = listings.filter((item) => item.status === 'AVAILABLE').length;
  const pendingCount = listings.filter((item) => item.status === 'PENDING_PICKUP').length;
  
  const soldListings = listings.filter((item) => item.status === 'SOLD');
  const soldCount = soldListings.length;
  const totalRevenue = soldListings.reduce((sum, item) => sum + (item.pricePerUnit * item.weight), 0);

  // Helper for dynamic status colors
  const getStatusDisplay = (status: string) => {
    switch(status) {
      case 'AVAILABLE': return { bg: 'bg-green-100', text: 'text-green-700', label: 'Available' };
      case 'PENDING_PICKUP': return { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Pending Pickup' };
      case 'SOLD': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Sold & Scanned' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-700', label: status };
    }
  };

  const renderInventoryItem = ({ item }: { item: Listing }) => {
    const { bg, text, label } = getStatusDisplay(item.status);
    const displayCategory = item.category ? item.category.toUpperCase() : "MATERIAL";

    return (
      <View className="bg-card border-border mb-4 flex-row items-center rounded-2xl border p-3 shadow-sm">
        
        {/* Left: Image */}
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

        {/* Middle: Info */}
        <View className="ml-4 flex-1 justify-center">
          <Text className="font-sans-bold text-muted-foreground mb-1 text-xs">
            {displayCategory} • {item.weight} kg
          </Text>
          <Text className="font-sans-bold text-primary mb-1 text-base" numberOfLines={1}>
            {item.title}
          </Text>
          <Text className="font-sans-bold text-sm text-green-600">
            GHS {(item.pricePerUnit ?? 0).toFixed(2)}
          </Text>
        </View>

        {/* Right: Badge & Action (FIXED STRETCHING BUG) */}
        <View className="items-end ml-2">
          
          <View className={`rounded-lg px-2 py-1 mb-2 ${bg}`}>
            <Text className={`font-sans-bold text-[10px] tracking-wider uppercase ${text}`}>
              {label}
            </Text>
          </View>
          
          {/* Only allow deletion if the item hasn't been paid for yet */}
          {item.status === 'AVAILABLE' ? (
            <TouchableOpacity 
              onPress={() => handleDelete(item.id)} 
              className="p-1.5 rounded-md bg-red-50 mt-1"
            >
              <Feather name="trash-2" size={16} color="#ef4444" />
            </TouchableOpacity>
          ) : (
             <View className="h-8" /> // Invisible spacer to keep layout aligned
          )}
        </View>
        
      </View>
    );
  };

  return (
    <SafeAreaView className="bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="bg-background px-6 py-4">
        <Text className="font-sans-bold text-primary mb-4 text-2xl">Dashboard</Text>

        {/* --- THE NEW 2x2 COMPACT METRICS GRID --- */}
        <View className="flex-row flex-wrap justify-between gap-y-3">
          
          {/* Active Metric */}
          <View className="bg-card border-border rounded-2xl border p-4 shadow-sm" style={{ width: '48%' }}>
            <View className="flex-row justify-between items-center mb-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green-100">
                <Feather name="box" size={14} color="#15803d" />
              </View>
              <Text className="font-sans-extrabold text-primary text-xl">{activeCount}</Text>
            </View>
            <Text className="font-sans-semibold text-muted-foreground text-xs">Active Listings</Text>
          </View>

          {/* Pending Metric */}
          <View className="bg-card border-border rounded-2xl border p-4 shadow-sm" style={{ width: '48%' }}>
            <View className="flex-row justify-between items-center mb-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                <Feather name="clock" size={14} color="#ea580c" />
              </View>
              <Text className="font-sans-extrabold text-primary text-xl">{pendingCount}</Text>
            </View>
            <Text className="font-sans-semibold text-muted-foreground text-xs">Pending Pickups</Text>
          </View>

          {/* Sold Metric */}
          <View className="bg-card border-border rounded-2xl border p-4 shadow-sm" style={{ width: '48%' }}>
            <View className="flex-row justify-between items-center mb-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Feather name="check-circle" size={14} color="#1d4ed8" />
              </View>
              <Text className="font-sans-extrabold text-primary text-xl">{soldCount}</Text>
            </View>
            <Text className="font-sans-semibold text-muted-foreground text-xs">Items Sold</Text>
          </View>

          {/* Revenue Metric */}
          <View className="bg-card border-border rounded-2xl border p-4 shadow-sm" style={{ width: '48%' }}>
            <View className="flex-row justify-between items-center mb-2">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Feather name="dollar-sign" size={14} color="#7e22ce" />
              </View>
              <Text className="font-sans-extrabold text-primary text-lg" numberOfLines={1}>
                {totalRevenue > 9999 ? `${(totalRevenue/1000).toFixed(1)}k` : totalRevenue}
              </Text>
            </View>
            <Text className="font-sans-semibold text-muted-foreground text-xs">Revenue (GHS)</Text>
          </View>

        </View>
      </View>

      <View style={{ flex: 1 }} className="px-6 pt-2">
        <Text className="font-sans-bold text-primary mb-3 text-lg">Inventory List</Text>

        {errorMessage ? (
          <EmptyState 
            icon="alert-triangle"
            title="Data Error"
            message={errorMessage}
            actionLabel="Try Again"
            onAction={fetchListings}
          />
        ) : isLoading ? (
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </ScrollView>
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
              <EmptyState 
                icon="package"
                title="No Inventory Yet"
                message="You haven't posted any scrap materials. Tap the + button to create your first listing."
              />
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