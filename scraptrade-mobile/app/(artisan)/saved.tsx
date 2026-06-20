import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

// Mock Bookmarked Data
const SAVED_LISTINGS = [
  {
    id: '2',
    title: 'Crushed PET Plastic Bottles',
    category: 'Plastics',
    weight: '800 kg',
    price: '₵2.50/kg',
    location: 'Spintex Road',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=500&auto=format&fit=crop'
  }
];

export default function SavedListings() {
  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* Header */}
      <View className="px-6 py-4 bg-background border-b border-border">
        <Text className="text-2xl font-sans-bold text-primary">Saved Scrap</Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pt-6 pb-24"
      >
        {SAVED_LISTINGS.length > 0 ? (
          <View className="gap-4">
            {SAVED_LISTINGS.map((item) => (
              <Link href={`/(artisan)/listing-detail?id=${item.id}`} asChild key={item.id}>
                <TouchableOpacity className="flex-row bg-card rounded-2xl border border-border overflow-hidden shadow-sm p-3">
                  
                  {/* Thumbnail */}
                  <Image 
                    source={{ uri: item.image }} 
                    className="h-24 w-24 rounded-xl bg-muted"
                    resizeMode="cover"
                  />

                  {/* Details */}
                  <View className="flex-1 ml-4 justify-center">
                    <View className="flex-row justify-between items-start">
                      <Text className="text-base font-sans-bold text-primary flex-1 mr-2" numberOfLines={2}>
                        {item.title}
                      </Text>
                      <TouchableOpacity>
                        {/* Filled bookmark to show it is saved */}
                        <Feather name="bookmark" size={20} color="#6366f1" className="fill-accent" />
                      </TouchableOpacity>
                    </View>
                    
                    <Text className="text-sm font-sans-bold text-accent mt-1">{item.price}</Text>
                    
                    <View className="flex-row items-center mt-2">
                      <Feather name="map-pin" size={12} color="#6b7280" />
                      <Text className="text-xs font-sans-medium text-muted-foreground ml-1">
                        {item.location}
                      </Text>
                    </View>
                  </View>

                </TouchableOpacity>
              </Link>
            ))}
          </View>
        ) : (
          /* Empty State */
          <View className="flex-1 items-center justify-center py-20">
            <View className="h-20 w-20 bg-accent/10 rounded-full items-center justify-center mb-6">
              <Feather name="bookmark" size={32} color="#6366f1" />
            </View>
            <Text className="text-xl font-sans-bold text-primary mb-2">No saved items</Text>
            <Text className="text-base font-sans-medium text-muted-foreground text-center px-4">
              When you see a pile of scrap you want to keep track of, tap the bookmark icon to save it here.
            </Text>
          </View>
        )}
      </ScrollView>

    </SafeAreaView>
  );
}