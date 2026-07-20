import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../api/client';
import { uploadListingImage, getUploadErrorMessage, type PickedImage } from '@/utils/uploadImage';
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
import { showErrorNotice, showSuccessNotice } from '@/utils/alert';

type ListingFields = 'title' | 'weight' | 'price' | 'pickupLocation' | 'image';

const CATEGORIES = [
  { key: 'METAL', label: 'Metal', icon: 'box' as const },
  { key: 'WOOD', label: 'Wood', icon: 'layers' as const },
  { key: 'TEXTILE', label: 'Textile', icon: 'scissors' as const },
];

export default function CreateListing() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;

  const [category, setCategory] = useState('METAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState<PickedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<ListingFields>>({});

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      showErrorNotice('Permission Required', 'You need to allow photo access to upload scrap images.');
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
      setErrors((e) => ({ ...e, image: undefined }));
    }
  };

  const validate = () => {
    const next: FieldErrors<ListingFields> = {
      title: validateRequiredText(title, 'Listing title', { min: 2 }) ?? undefined,
      weight: validatePositiveNumber(weight, 'Weight') ?? undefined,
      price: validatePositiveNumber(price, 'Price per kg') ?? undefined,
      pickupLocation: validateRequiredText(pickupLocation, 'Pickup location', { min: 2 }) ?? undefined,
      image: !image ? 'Please add a photo.' : undefined,
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!image) return;

    setIsLoading(true);

    try {
      const listingResponse = await apiClient.post('/listings', {
        title: title.trim(),
        description: description.trim(),
        category: category,
        weight: parseFloat(weight),
        dimensions: dimensions.trim(),
        pickupLocation: pickupLocation.trim(),
        pricePerUnit: parseFloat(price),
      });

      const newListingId = listingResponse.data.id;

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

      if (Platform.OS === 'web') {
        window.alert(successMsg);
        router.back();
      } else {
        showSuccessNotice(
          imageFailed ? 'Listing Created' : 'Success!',
          successMsg,
          () => router.back()
        );
      }
    } catch (error: any) {
      console.error('Create listing failed:', error);
      showErrorNotice(
        'Create Failed',
        error.response?.data?.message || 'Something went wrong while connecting to the server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="New Listing" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-5 pb-6 pt-2"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <TouchableOpacity
              onPress={pickImage}
              activeOpacity={0.85}
              className="h-52 w-full items-center justify-center overflow-hidden rounded-[28px]"
              style={{
                backgroundColor: colors.card,
                borderWidth: image ? 0 : 1.5,
                borderColor: errors.image ? colors.destructive : colors.border,
                borderStyle: 'dashed',
              }}>
              {image ? (
                <>
                  <Image source={{ uri: image.uri }} className="h-full w-full" resizeMode="cover" />
                  <View className="absolute inset-0" style={{ backgroundColor: `${colors.inverse}1A` }} />
                  <View
                    className="absolute right-3 bottom-3 flex-row items-center gap-1.5 rounded-full px-3 py-1.5"
                    style={{ backgroundColor: `${colors.inverse}99` }}>
                    <Feather name="edit-2" size={12} color="#ffffff" />
                    <Text className="font-sans-semibold text-xs text-white">Change photo</Text>
                  </View>
                </>
              ) : (
                <>
                  <View
                    className="mb-3 h-16 w-16 items-center justify-center rounded-full"
                    style={theme.accentSoft}>
                    <Feather name="camera" size={26} color={colors.accent} />
                  </View>
                  <Text className="font-sans-semibold text-base" style={theme.textPrimary}>
                    Add a photo
                  </Text>
                  <Text className="mt-1 font-sans-medium text-sm" style={theme.textMuted}>
                    JPEG or PNG · max 5MB
                  </Text>
                </>
              )}
            </TouchableOpacity>
            {errors.image ? (
              <Text className="mt-2 text-sm font-sans-medium" style={{ color: colors.destructive }}>
                {errors.image}
              </Text>
            ) : null}
          </View>

          <View className="mb-6">
            <Text
              className="mb-3 font-sans-semibold text-xs uppercase tracking-wide"
              style={theme.sectionLabel}>
              Material Category
            </Text>
            <View className="flex-row gap-2.5">
              {CATEGORIES.map((cat) => {
                const selected = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategory(cat.key)}
                    activeOpacity={0.85}
                    className="flex-1 items-center gap-1.5 rounded-2xl py-3.5"
                    style={selected ? theme.accentFill : theme.card}>
                    <Feather
                      name={cat.icon}
                      size={16}
                      color={selected ? colors.onAccent : colors.mutedForeground}
                    />
                    <Text
                      className="font-sans-semibold text-xs"
                      style={selected ? theme.textOnAccent : theme.textMuted}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-8 gap-4">
            <TextField
              label="Listing Title *"
              leftIcon="edit-3"
              value={title}
              error={errors.title}
              placeholder="e.g., Heavy Duty Copper Wire"
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
              placeholder="Describe the condition..."
              textAlignVertical="top"
              onChangeText={setDescription}
            />

            <View className="flex-row gap-4">
              <TextField
                label="Weight (kg) *"
                leftIcon="package"
                containerClassName="flex-1"
                value={weight}
                error={errors.weight}
                placeholder="50"
                keyboardType="decimal-pad"
                onChangeText={(v) => {
                  setWeight(v);
                  setErrors((e) => ({ ...e, weight: undefined }));
                }}
              />

              <TextField
                label="Price / kg (GHS) *"
                leftIcon="dollar-sign"
                containerClassName="flex-1"
                value={price}
                error={errors.price}
                placeholder="5.50"
                keyboardType="decimal-pad"
                onChangeText={(v) => {
                  setPrice(v);
                  setErrors((e) => ({ ...e, price: undefined }));
                }}
              />
            </View>

            <TextField
              label="Dimensions & Specs"
              leftIcon="maximize"
              value={dimensions}
              placeholder="e.g., 2m x 1m, 5mm thickness"
              onChangeText={setDimensions}
            />

            <TextField
              label="Pickup Location *"
              leftIcon="map-pin"
              value={pickupLocation}
              error={errors.pickupLocation}
              placeholder="e.g., Plot 12, Spintex Road, Accra"
              onChangeText={(v) => {
                setPickupLocation(v);
                setErrors((e) => ({ ...e, pickupLocation: undefined }));
              }}
            />
          </View>

          <Button label="Publish Listing" loading={isLoading} onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
