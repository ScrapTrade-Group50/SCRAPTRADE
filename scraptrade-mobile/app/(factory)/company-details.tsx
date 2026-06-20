import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CompanyDetails() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-background border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0b1f1a" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-primary">Company Details</Text>
        </View>
        <TouchableOpacity>
          <Text className="text-base font-sans-bold text-accent">Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerClassName="px-6 pt-6 pb-12" 
        showsVerticalScrollIndicator={false}
      >
        
        {/* Logo Edit */}
        <View className="items-center mb-8 pt-4">
          <View className="relative">
            <View className="h-24 w-24 bg-accent/10 rounded-2xl items-center justify-center border-4 border-card shadow-sm">
              <Text className="text-3xl font-sans-bold text-accent">TS</Text>
            </View>
            <TouchableOpacity className="absolute -bottom-2 -right-2 bg-primary h-8 w-8 rounded-full items-center justify-center border-2 border-white shadow-sm">
              <Feather name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forms */}
        <View className="gap-5 mb-10">
          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Registered Company Name</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              defaultValue="Tema Steel Works Ltd."
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Business Registration Number</Text>
            <TextInput
              className="rounded-xl border border-border bg-muted px-4 py-4 text-base font-sans-medium text-muted-foreground"
              defaultValue="CS039482020"
              editable={false} // Usually locked after verification
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Contact Phone</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              defaultValue="024 987 6543"
              keyboardType="phone-pad"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Business Email</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              defaultValue="admin@temasteel.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}