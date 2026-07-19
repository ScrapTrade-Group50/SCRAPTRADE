import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client'; // Adjust path if needed
import { uploadListingImage, getUploadErrorMessage, type PickedImage } from '@/utils/uploadImage';

export default function CreateListing() {
  const router = useRouter();

  // --- STATE MANAGEMENT ---
  const [category, setCategory] = useState('METAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- 1. PHOTO PICKER FUNCTION ---
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'You need to allow photo access to upload scrap images.');
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

  // --- 2. BACKEND SUBMISSION FUNCTION ---
  const handleSubmit = async () => {
    if (!title || !weight || !price || !image || !pickupLocation) {
      Alert.alert('Missing Info', 'Please fill in title, weight, price per kg, pickup location, and select a photo.');
      return;
    }

    setIsLoading(true);

    try {
      const listingResponse = await apiClient.post('/listings', {
        title: title,
        description: description,
        category: category,
        weight: parseFloat(weight),
        dimensions: dimensions,
        pickupLocation: pickupLocation,
        pricePerUnit: parseFloat(price),
      });

      const newListingId = listingResponse.data.id;

      // Phase 2: Upload the image. The listing already exists at this point, so an
      // image failure (e.g. Cloudinary misconfig) must NOT be reported as a total failure.
      let imageFailed = false;
      let uploadError: unknown = null;
      try {
        await uploadListingImage(newListingId, image);
      } catch (imageError: unknown) {
        imageFailed = true;
        uploadError = imageError;
      }

      const successMsg = imageFailed
        ? `Your listing was created, but the photo could not be uploaded. ${getUploadErrorMessage(uploadError)}`
        : 'Your scrap listing is now live.';

      // Phase 3: Navigate back to the dashboard (WEB & MOBILE SAFE)
      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.back();
      } else {
        Alert.alert(imageFailed ? 'Listing Created' : 'Success!', successMsg, [
          {
            text: 'OK',
            onPress: () => {
              // The setTimeout forces the app to wait for the popup to close before navigating
              setTimeout(() => {
                router.back();
              }, 100);
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error('Create listing failed:', error);
      Alert.alert('Create Failed', error.response?.data?.message || 'Something went wrong while connecting to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1" style={{ flex: 1 }} edges={['top']}>
      {/* HEADER: Navigation */}
      <View className="border-border bg-background flex-row items-center border-b px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="font-sans-bold text-primary text-xl">New Listing</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 py-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Photo Upload Area */}
          <TouchableOpacity
            onPress={pickImage}
            className="bg-card border-border mb-8 h-48 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed">
            {image ? (
              <Image source={{ uri: image.uri }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <>
                <View className="bg-background border-border mb-2 h-14 w-14 items-center justify-center rounded-full border shadow-sm">
                  <Feather name="camera" size={24} color="#6366f1" />
                </View>
                <Text className="font-sans-bold text-primary text-base">Tap to Add Photos</Text>
                <Text className="font-sans-medium text-muted-foreground mt-1 text-sm">
                  JPEG or PNG, max 5MB
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Category Picker */}
          <View className="mb-8">
            <Text className="font-sans-semibold text-primary mb-3 text-sm">Material Category</Text>
            <View className="flex-row gap-3">
              {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`flex-1 items-center rounded-xl border-2 py-3 ${
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

          {/* Details Form */}
          <View className="mb-10 gap-5">
            {/* Title Input */}
            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Listing Title *</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-3 text-base"
                placeholder="e.g., Heavy Duty Copper Wire"
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Description Input */}
            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Description</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                className="border-border bg-card font-sans-medium text-primary text-top h-24 rounded-xl border px-4 py-3 text-base"
                placeholder="Describe the condition..."
                placeholderTextColor="#64748b"
              />
            </View>

            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Weight (kg) *</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-3 text-base"
                placeholder="e.g., 50"
                placeholderTextColor="#64748b"
                keyboardType="numeric"
              />
            </View>

            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Dimensions & Specs</Text>
              <TextInput
                value={dimensions}
                onChangeText={setDimensions}
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-3 text-base"
                placeholder="e.g., 2m x 1m, 5mm thickness"
                placeholderTextColor="#64748b"
              />
            </View>

            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Pickup Location *</Text>
              <TextInput
                value={pickupLocation}
                onChangeText={setPickupLocation}
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-3 text-base"
                placeholder="e.g., Plot 12, Spintex Road, Accra"
                placeholderTextColor="#64748b"
              />
            </View>

            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Price per kg (GHS) *</Text>
              <TextInput
                value={price}
                onChangeText={setPrice}
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-3 text-base"
                placeholder="e.g., 5.50"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          {/* Publish Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className={`mb-6 w-full flex-row items-center justify-center rounded-xl py-4 shadow-sm ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}>
            {isLoading && <ActivityIndicator color="#ffffff" className="mr-2" />}
            <Text className="font-sans-bold text-base text-white">
              {isLoading ? 'Publishing...' : 'Publish Listing'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
