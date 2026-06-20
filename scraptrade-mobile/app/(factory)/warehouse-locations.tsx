import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function WarehouseLocations() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Warehouses</Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerClassName="px-6 pt-6 pb-12" 
        showsVerticalScrollIndicator={false}
      >
        
        <Text className="text-sm font-sans-medium text-muted-foreground mb-6">
          Manage the locations where buyers can pick up scrap materials.
        </Text>

        {/* Primary Location Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
          {/* Default Badge */}
          <View className="absolute top-0 right-0 bg-accent/10 px-3 py-1 rounded-bl-xl border-b border-l border-accent/20">
            <Text className="text-xs font-sans-bold text-accent">PRIMARY HQ</Text>
          </View>

          <View className="flex-row items-start mb-4 pt-1">
            <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-3 border border-border">
              <Feather name="map" size={18} color="#0b1f1a" />
            </View>
            <View className="flex-1 pr-16">
              <Text className="text-lg font-sans-bold text-primary">Tema Main Yard</Text>
              <Text className="text-base font-sans-medium text-muted-foreground mt-1 leading-5">
                Heavy Industrial Area, Plot 42{"\n"}Tema, Greater Accra
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center justify-between pt-4 border-t border-border">
            <TouchableOpacity className="flex-row items-center">
              <Feather name="edit-2" size={16} color="#6366f1" />
              <Text className="text-sm font-sans-bold text-accent ml-2">Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-row items-center">
              <Feather name="trash-2" size={16} color="#ef4444" />
              <Text className="text-sm font-sans-bold text-red-500 ml-2">Remove</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add New Button */}
        <TouchableOpacity className="w-full flex-row items-center justify-center rounded-2xl bg-card border-2 border-dashed border-border py-6 mt-2 shadow-sm">
          <Feather name="plus-circle" size={24} color="#6366f1" />
          <Text className="text-base font-sans-bold text-accent ml-2">Add New Location</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}