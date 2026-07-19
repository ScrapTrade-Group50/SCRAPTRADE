import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function EditListing() {
  const router = useRouter();
  
  // Pre-filled mock data that would normally come from your database
  const [category, setCategory] = useState('METAL');
  const [weight, setWeight] = useState('120');
  const [dimensions, setDimensions] = useState('Varies: approx. 10cm x 15cm pieces');
  const [price, setPrice] = useState('450');

  const handleUpdate = () => {
    Alert.alert("Success", "Listing updated successfully!", [
      { text: "OK", onPress: () => router.back() }
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Listing",
      "Are you sure you want to permanently delete this listing? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => router.back() }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER */}
      <View className="flex-row items-center px-6 py-4 border-b border-border bg-background">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Edit Listing</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* Photo Editor Placeholder */}
          <View className="mb-8">
            <Text className="text-sm font-sans-semibold text-primary mb-3">Listing Photos</Text>
            <View className="flex-row gap-3">
              {/* Keeping a dark background for the active image thumbnail */}
              <View className="h-24 w-24 bg-primary rounded-xl items-center justify-center relative">
                 <Feather name="image" size={24} color="#ffffff" />
                 <TouchableOpacity className="absolute -top-2 -right-2 bg-card rounded-full p-1 border border-border shadow-sm">
                   <Feather name="x" size={12} color="#ef4444" />
                 </TouchableOpacity>
              </View>
              <TouchableOpacity className="h-24 w-24 bg-card rounded-xl border-2 border-dashed border-border items-center justify-center">
                <Feather name="plus" size={24} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>

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
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Dimensions & Specs</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                value={dimensions}
                onChangeText={setDimensions}
              />
            </View>

            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Asking Price (GHS)</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
          </View>

          {/* Update Button */}
          <TouchableOpacity 
            onPress={handleUpdate}
            className="w-full items-center rounded-xl bg-primary py-4 shadow-sm mb-4">
            <Text className="text-base font-sans-bold text-white">Save Changes</Text>
          </TouchableOpacity>

          {/* Delete Button (Kept semantic red for destructive action) */}
          <TouchableOpacity 
            onPress={handleDelete}
            className="w-full items-center rounded-xl bg-red-50 py-4 border border-red-200 shadow-sm mb-6 flex-row justify-center gap-2">
            <Feather name="trash-2" size={18} color="#ef4444" />
            <Text className="text-base font-sans-bold text-red-500">Delete Listing</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}