import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { uploadListingImage, type PickedImage } from '@/utils/uploadImage';

type Listing = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  weight: number;
  dimensions: string;
  pickupLocation?: string;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
};

export default function EditListing() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [category, setCategory] = useState('METAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        const data: Listing = response.data;
        if (data.status !== 'AVAILABLE') {
          Alert.alert('Cannot Edit', 'This listing can no longer be edited.');
          router.back();
          return;
        }
        setTitle(data.title);
        setDescription(data.description ?? '');
        setCategory(data.category ?? 'METAL');
        setWeight(String(data.weight));
        setDimensions(data.dimensions ?? '');
        setPickupLocation(data.pickupLocation ?? '');
        setPrice(String(data.pricePerUnit));
        setImageUrl(data.imageUrl);
      } catch {
        Alert.alert('Error', 'Could not load listing.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchListing();
  }, [id, router]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Allow photo access to update listing images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setImage({
        uri: asset.uri,
        fileName: asset.fileName,
        mimeType: asset.mimeType,
      });
    }
  };

  const handleUpdate = async () => {
    if (!title || !weight || !price || !pickupLocation) {
      Alert.alert('Missing Info', 'Please fill in title, weight, price per kg, and pickup location.');
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.put(`/listings/${id}`, {
        title,
        description,
        category,
        weight: parseFloat(weight),
        dimensions,
        pickupLocation,
        pricePerUnit: parseFloat(price),
      });

      if (image) {
        await uploadListingImage(id as string, image);
      }

      Alert.alert('Success', 'Listing updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (error: any) {
      Alert.alert('Update Failed', error.response?.data?.message || 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete Listing', 'Permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/listings/${id}`);
            router.back();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Could not delete listing.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  const displayImage = image?.uri ?? imageUrl;

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
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
          <TouchableOpacity
            onPress={pickImage}
            className="bg-card border-border mb-8 h-48 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed">
            {displayImage ? (
              <Image source={{ uri: displayImage }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <>
                <Feather name="camera" size={28} color="#6366f1" />
                <Text className="font-sans-bold text-primary mt-2">Tap to change photo</Text>
              </>
            )}
          </TouchableOpacity>

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
                  <Text
                    className={`font-sans-bold text-xs ${category === cat ? 'text-accent' : 'text-muted-foreground'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="gap-5 mb-10">
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Listing Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary h-24"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Weight (kg) *</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Dimensions & Specs</Text>
              <TextInput
                value={dimensions}
                onChangeText={setDimensions}
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Pickup Location *</Text>
              <TextInput
                value={pickupLocation}
                onChangeText={setPickupLocation}
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Price per kg (GHS) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                className="rounded-xl border border-border bg-card px-4 py-3 text-base font-sans-medium text-primary"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={isSaving}
            className={`w-full items-center rounded-xl py-4 shadow-sm mb-4 ${isSaving ? 'bg-primary/70' : 'bg-primary'}`}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-sans-bold text-white">Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="w-full items-center rounded-xl bg-red-50 py-4 border border-red-200 mb-6 flex-row justify-center gap-2">
            <Feather name="trash-2" size={18} color="#ef4444" />
            <Text className="text-base font-sans-bold text-red-500">Delete Listing</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
