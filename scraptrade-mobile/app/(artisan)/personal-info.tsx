import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PersonalInformation() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4 bg-background border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0b1f1a" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-primary">Personal Info</Text>
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
        
        {/* Profile Image Edit */}
        <View className="items-center mb-8 pt-4">
          <View className="relative">
            <View className="h-24 w-24 bg-accent/10 rounded-full items-center justify-center border-4 border-card shadow-sm">
              <Text className="text-3xl font-sans-bold text-accent">KM</Text>
            </View>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-primary h-8 w-8 rounded-full items-center justify-center border-2 border-white">
              <Feather name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forms */}
        <View className="gap-5 mb-10">
          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Full Name</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              defaultValue="Kwame Mensah"
              placeholderTextColor="#9ca3af"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Email Address</Text>
            <TextInput
              className="rounded-xl border border-border bg-muted px-4 py-4 text-base font-sans-medium text-muted-foreground"
              defaultValue="kwame@example.com"
              editable={false} // Emails are usually locked or require special verification to change
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Phone Number</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              defaultValue="024 123 4567"
              keyboardType="phone-pad"
            />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}