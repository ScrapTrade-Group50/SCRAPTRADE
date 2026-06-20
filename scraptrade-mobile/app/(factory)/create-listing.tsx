import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function CreateListing() {
  const router = useRouter();
  const [category, setCategory] = useState('METAL');

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER: Navigation */}
      <View className="flex-row items-center px-6 py-4 border-b border-border bg-background">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">New Listing</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        
        {/* Added explicit flex: 1 to the ScrollView to stop it from collapsing */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Photo Upload Placeholder */}
          <TouchableOpacity className="h-48 w-full bg-card rounded-3xl border-2 border-dashed border-border items-center justify-center mb-8">
            <View className="h-14 w-14 bg-background rounded-full items-center justify-center mb-2 shadow-sm border border-border">
              {/* Keeping hex here since Vector Icons require specific color codes */}
              <Feather name="camera" size={24} color="#f97316" /> 
            </View>
            <Text className="text-base font-sans-bold text-primary">Tap to Add Photos</Text>
            <Text className="text-sm font-sans-medium text-muted-foreground mt-1">JPEG or PNG, max 5MB</Text>
          </TouchableOpacity>

          {/* Category Picker */}
          <View className="mb-8">
            <Text className="text-sm font-sans-semibold text-primary mb-3">Material Category</Text>
            <View className="flex-row gap-3">
              {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`flex-1 items-center py-3 rounded-xl border-2 ${
                    category === cat ? 'border-accent bg-accent/10' : 'border-border bg-card'
                  }`}>
                  <Text className={`font-sans-bold text-xs ${category === cat ? 'text-accent' : 'text-muted-foreground'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Details Form */}
          <View className="gap-5 mb-10">
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Weight (kg)</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                placeholder="e.g., 50"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Dimensions & Specs</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                placeholder="e.g., 2m x 1m, 5mm thickness"
                placeholderTextColor="#64748b"
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Asking Price (GHS)</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                placeholder="e.g., 250"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Publish Button */}
          <TouchableOpacity className="w-full items-center rounded-xl bg-accent py-4 shadow-sm mb-6">
            <Text className="text-base font-sans-bold text-white">Publish Listing</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}