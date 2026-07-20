import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import { apiClient } from '../../api/client';
import { useSavedStore } from '../../store/savedStore';
import { formatPickupLine } from '@/utils/gatePassRoute';
import { showErrorNotice } from '@/utils/alert';

const { width } = Dimensions.get('window');

type Listing = {
  id: number;
  title: string;
  description?: string;
  category?: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  imageUrl: string | null;
  dimensions: string;
  pickupLocation?: string;
  seller?: {
    companyName?: string;
  };
};

function DetailRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: object }) {
  const theme = useScreenTheme();
  return (
    <View style={{ width: '50%', paddingRight: 12, marginBottom: 16 }}>
      <Text className="mb-1 text-xs font-sans-semibold uppercase tracking-wider" style={theme.textMuted}>
        {label}
      </Text>
      <Text className="text-lg font-sans-bold" style={valueStyle ?? theme.textPrimary}>
        {value}
      </Text>
    </View>
  );
}

export default function ListingDetail() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const { id } = useLocalSearchParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const numericId = Number(id);
  const saved = useSavedStore((state) => state.ids.includes(numericId));
  const toggleSaved = useSavedStore((state) => state.toggle);
  const fetchSavedIds = useSavedStore((state) => state.fetchIds);

  useEffect(() => {
    fetchSavedIds();
  }, [fetchSavedIds]);

  const handleToggleSaved = async () => {
    if (!numericId) return;
    try {
      await toggleSaved(numericId);
    } catch {
      showErrorNotice('Error', 'Could not update your saved items. Please try again.');
    }
  };

  useEffect(() => {
    const fetchListingDetail = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        setListing(response.data);
      } catch (error) {
        console.error('Failed to fetch listing details:', error);
        showErrorNotice('Error', 'Could not load item details. It may have been sold or removed.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchListingDetail();
  }, [id]);

  const getStatusStyle = (status: string) => {
    if (status === 'AVAILABLE') return { textStyle: theme.textSuccess, label: 'Available' };
    if (status === 'PENDING_PICKUP') return { textStyle: theme.textAccent, label: 'Pending pickup' };
    if (status === 'SOLD') return { textStyle: theme.textMuted, label: 'Sold' };
    return { textStyle: theme.textMuted, label: status };
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView edges={['top']}>
        <View className="absolute left-6 top-12 z-10 h-12 w-12 rounded-full" style={theme.cardMuted} />
        <View className="h-72 w-full" style={theme.cardMuted} />
        <View className="gap-3 px-6 py-6 opacity-60">
          <View className="h-6 w-24 rounded-lg" style={theme.cardMuted} />
          <View className="h-10 w-3/4 rounded-lg" style={theme.cardMuted} />
          <View className="h-20 w-full rounded-2xl" style={theme.cardMuted} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (!listing) return null;

  const totalPrice = (listing.weight * (listing.pricePerUnit || 0)).toFixed(2);
  const sellerName = listing.seller?.companyName?.trim() || 'Verified factory';
  const pickupLine =
    formatPickupLine(listing.seller?.companyName, listing.pickupLocation) ||
    listing.pickupLocation ||
    'Contact factory for pickup details';
  const displayCategory = listing.category ? listing.category.toUpperCase() : 'MATERIAL';
  const isAvailable = listing.status === 'AVAILABLE';
  const statusStyle = getStatusStyle(listing.status);

  return (
    <ThemedSafeAreaView edges={['top']}>
      <View className="absolute left-5 top-12 z-20">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-11 w-11 items-center justify-center rounded-full border"
          style={{ backgroundColor: `${colors.card}E6`, borderColor: colors.border }}>
          <Feather name="arrow-left" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View className="absolute right-5 top-12 z-20">
        <TouchableOpacity
          onPress={handleToggleSaved}
          className="h-11 w-11 items-center justify-center rounded-full border"
          style={{ backgroundColor: `${colors.card}E6`, borderColor: colors.border }}>
          <Feather name="bookmark" size={20} color={saved ? colors.accent : colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="h-72 w-full items-center justify-center" style={theme.cardMuted}>
          {listing.imageUrl ? (
            <Image
              source={{ uri: listing.imageUrl }}
              style={{ width, height: 288 }}
              resizeMode="cover"
            />
          ) : (
            <Feather name="image" size={48} color={colors.mutedForeground} />
          )}
        </View>

        <View className="px-6 pt-5">
          <View className="mb-4 flex-row items-start justify-between gap-3">
            <View className="rounded-full px-3 py-1.5" style={theme.accentSoft}>
              <Text className="text-[11px] font-sans-bold uppercase tracking-widest" style={theme.textAccent}>
                {displayCategory}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-3xl font-sans-extrabold" style={theme.textSuccess}>
                GHS {totalPrice}
              </Text>
              <Text className="text-xs font-sans-medium" style={theme.textMuted}>
                GHS {listing.pricePerUnit.toFixed(2)}/kg
              </Text>
            </View>
          </View>

          <Text className="mb-4 text-2xl font-sans-extrabold leading-8" style={theme.textPrimary}>
            {listing.title}
          </Text>

          <View
            className="mb-4 flex-row items-start rounded-2xl border p-4"
            style={{ ...theme.card, borderColor: colors.border }}>
            <View
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={theme.accentSoft}>
              <Feather name="briefcase" size={18} color={colors.accent} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-sans-bold uppercase tracking-wider" style={theme.textMuted}>
                Sold by
              </Text>
              <Text className="mt-0.5 text-base font-sans-bold" style={theme.textPrimary}>
                {sellerName}
              </Text>
              <View className="mt-2 flex-row items-start">
                <Feather name="map-pin" size={14} color={colors.mutedForeground} style={{ marginTop: 2 }} />
                <Text className="ml-1.5 flex-1 text-sm font-sans-medium" style={theme.textMuted}>
                  {pickupLine}
                </Text>
              </View>
            </View>
          </View>

          {listing.description ? (
            <View
              className="mb-4 rounded-2xl border p-4"
              style={{ ...theme.card, borderColor: colors.border }}>
              <Text className="mb-2 text-base font-sans-bold" style={theme.textPrimary}>
                About this material
              </Text>
              <Text className="text-sm font-sans-medium leading-6" style={theme.textMuted}>
                {listing.description}
              </Text>
            </View>
          ) : null}

          <View
            className="rounded-2xl border p-4"
            style={{ ...theme.card, borderColor: colors.border }}>
            <Text className="mb-3 text-base font-sans-bold" style={theme.textPrimary}>
              Specifications
            </Text>
            <View className="flex-row flex-wrap">
              <DetailRow label="Weight" value={`${listing.weight} kg`} />
              <DetailRow label="Status" value={statusStyle.label} valueStyle={statusStyle.textStyle} />
              <DetailRow label="Dimensions" value={listing.dimensions || 'Not specified'} />
              <DetailRow label="Price / kg" value={`GHS ${listing.pricePerUnit.toFixed(2)}`} valueStyle={theme.textSuccess} />
            </View>
          </View>
        </View>
      </ScrollView>

      <View
        className="absolute bottom-0 w-full px-6 py-5"
        style={{ ...theme.bottomBar, paddingBottom: resolved === 'dark' ? 28 : 24 }}>
        {isAvailable ? (
          <Link href={`/(artisan)/checkout?id=${listing.id}`} asChild>
            <TouchableOpacity
              className="w-full flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={theme.accentFill}>
              <Feather name="shopping-bag" size={20} color={colors.onAccent} />
              <Text className="text-base font-sans-bold" style={theme.textOnAccent}>
                Checkout with MoMo
              </Text>
            </TouchableOpacity>
          </Link>
        ) : (
          <View
            className="w-full items-center rounded-2xl border py-4"
            style={{ ...theme.cardMuted, borderColor: colors.border }}>
            <Text className="text-base font-sans-bold" style={theme.textMuted}>
              Not available
            </Text>
          </View>
        )}
      </View>
    </ThemedSafeAreaView>
  );
}
