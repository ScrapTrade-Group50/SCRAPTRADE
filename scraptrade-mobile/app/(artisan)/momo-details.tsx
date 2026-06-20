import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function MoMoDetails() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Mobile Money</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        <Text className="text-sm font-sans-medium text-muted-foreground mb-6">
          Manage your saved Mobile Money wallets for faster checkouts and secure payouts.
        </Text>

        {/* Saved MoMo Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
          {/* Active Badge */}
          <View className="absolute top-0 right-0 bg-emerald-100 px-3 py-1 rounded-bl-xl border-b border-l border-emerald-200">
            <Text className="text-xs font-sans-bold text-emerald-700">DEFAULT</Text>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="h-12 w-12 bg-yellow-400 rounded-full items-center justify-center mr-4 border-2 border-white shadow-sm">
              <Text className="text-sm font-sans-extrabold text-black">MTN</Text>
            </View>
            <View>
              <Text className="text-lg font-sans-bold text-primary">Kwame Mensah</Text>
              <Text className="text-base font-sans-medium text-muted-foreground mt-0.5">024 123 4567</Text>
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
        <TouchableOpacity className="w-full flex-row items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 py-4 mt-4 shadow-sm">
          <Feather name="plus" size={20} color="#6366f1" />
          <Text className="text-base font-sans-bold text-accent ml-2">Add New Wallet</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}