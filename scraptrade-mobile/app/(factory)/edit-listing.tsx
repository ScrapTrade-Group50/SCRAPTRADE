import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { uploadListingImage, type PickedImage } from '@/utils/uploadImage';
import ScreenHeader from '@/components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Button, TextField } from '@/components/ui';
import {
  validatePositiveNumber,
  validateRequiredText,
  type FieldErrors,
  hasErrors,
} from '@/utils/validation';
import { showConfirm, showErrorNotice, showSuccessNotice } from '@/utils/alert';

type ListingFields = 'title' | 'weight' | 'price' | 'pickupLocation';

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
  const theme = useScreenTheme();
  const { colors } = theme;
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
  const [errors, setErrors] = useState<FieldErrors<ListingFields>>({});

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        const data: Listing = response.data;
        if (data.status !== 'AVAILABLE') {
          showErrorNotice('Cannot Edit', 'This listing can no longer be edited.');
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
        showErrorNotice('Error', 'Could not load listing.');
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
      showErrorNotice('Permission Required', 'Allow photo access to update listing images.');
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

  const validate = () => {
    const next: FieldErrors<ListingFields> = {
      title: validateRequiredText(title, 'Listing title', { min: 2 }) ?? undefined,
      weight: validatePositiveNumber(weight, 'Weight') ?? undefined,
      price: validatePositiveNumber(price, 'Price per kg') ?? undefined,
      pickupLocation: validateRequiredText(pickupLocation, 'Pickup location', { min: 2 }) ?? undefined,
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const handleUpdate = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await apiClient.put(`/listings/${id}`, {
        title: title.trim(),
        description: description.trim(),
        category,
        weight: parseFloat(weight),
        dimensions: dimensions.trim(),
        pickupLocation: pickupLocation.trim(),
        pricePerUnit: parseFloat(price),
      });

      if (image) {
        await uploadListingImage(id as string, image);
      }

      showSuccessNotice('Success', 'Listing updated.', () => router.back());
    } catch (error: any) {
      showErrorNotice('Update Failed', error.response?.data?.message || 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    showConfirm('Delete Listing', 'Permanently delete this listing?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/listings/${id}`);
            router.back();
          } catch (error: any) {
            showErrorNotice('Error', error.response?.data?.message || 'Could not delete listing.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedSafeAreaView>
    );
  }

  const displayImage = image?.uri ?? imageUrl;

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Edit Listing" />

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
            className="mb-8 h-48 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed"
            style={{ ...theme.card, borderColor: colors.border }}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <>
                <Feather name="camera" size={28} color={colors.accent} />
                <Text className="mt-2 font-sans-bold" style={theme.textPrimary}>
                  Tap to change photo
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View className="mb-8">
            <Text className="mb-3 text-sm font-sans-semibold" style={theme.textPrimary}>
              Material Category
            </Text>
            <View className="flex-row gap-3">
              {['METAL', 'WOOD', 'TEXTILE'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className="flex-1 items-center rounded-xl border-2 py-3"
                  style={
                    category === cat
                      ? { ...theme.accentSoft, borderColor: colors.accent }
                      : theme.card
                  }>
                  <Text
                    className="font-sans-bold text-xs"
                    style={category === cat ? theme.textAccent : theme.textMuted}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View className="mb-10 gap-5">
            <TextField
              label="Listing Title *"
              leftIcon="edit-3"
              value={title}
              error={errors.title}
              onChangeText={(v) => {
                setTitle(v);
                setErrors((e) => ({ ...e, title: undefined }));
              }}
            />
            <TextField
              label="Description"
              leftIcon="file-text"
              value={description}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              onChangeText={setDescription}
            />
            <TextField
              label="Weight (kg) *"
              leftIcon="package"
              value={weight}
              error={errors.weight}
              keyboardType="decimal-pad"
              onChangeText={(v) => {
                setWeight(v);
                setErrors((e) => ({ ...e, weight: undefined }));
              }}
            />
            <TextField
              label="Dimensions & Specs"
              leftIcon="maximize"
              value={dimensions}
              onChangeText={setDimensions}
            />
            <TextField
              label="Pickup Location *"
              leftIcon="map-pin"
              value={pickupLocation}
              error={errors.pickupLocation}
              onChangeText={(v) => {
                setPickupLocation(v);
                setErrors((e) => ({ ...e, pickupLocation: undefined }));
              }}
            />
            <TextField
              label="Price per kg (GHS) *"
              leftIcon="dollar-sign"
              value={price}
              error={errors.price}
              keyboardType="decimal-pad"
              onChangeText={(v) => {
                setPrice(v);
                setErrors((e) => ({ ...e, price: undefined }));
              }}
            />
          </View>

          <Button
            label="Save Changes"
            loading={isSaving}
            className="mb-4"
            onPress={handleUpdate}
          />

          <Button
            label="Delete Listing"
            variant="danger"
            className="mb-6 flex-row gap-2"
            onPress={handleDelete}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
