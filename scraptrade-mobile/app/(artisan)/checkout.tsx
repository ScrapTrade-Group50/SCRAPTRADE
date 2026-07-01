import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';

type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
};

const ESCROW_FEE = 15;

export default function Checkout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [listing, setListing] = useState<Listing | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await apiClient.get(`/listings/${id}`);
        const data = response.data;
        if (data.status !== 'AVAILABLE') {
          Alert.alert('Unavailable', 'This item is no longer available for purchase.');
          router.back();
          return;
        }
        setListing(data);
      } catch {
        Alert.alert('Error', 'Item not found.');
        router.back();
      }
    };
    if (id) fetchListing();
  }, [id, router]);

  if (!listing) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  const itemPrice = listing.pricePerUnit * listing.weight;
  const total = itemPrice + ESCROW_FEE;

  const handlePayment = async () => {
    if (momoNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit MoMo number.');
      return;
    }

    setIsProcessing(true);

    try {
      const response = await apiClient.post(
        `/orders/checkout?listingId=${id}&momoNumber=${encodeURIComponent(momoNumber)}`
      );

      router.replace(
        `/(artisan)/gate-pass?code=${response.data.gatePassCode}&title=${encodeURIComponent(listing.title)}&weight=${listing.weight}&amount=${response.data.totalAmount}`
      );
    } catch (error: any) {
      Alert.alert(
        'Payment Failed',
        error.response?.data?.message || 'Could not complete transaction.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1" style={{ flex: 1 }} edges={['top']}>
      <View className="bg-background flex-row items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="font-sans-bold text-primary text-xl">Secure Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View className="flex-1 px-5 pt-2 pb-6 flex-col">
          <View className="bg-card border-border mb-6 rounded-2xl border p-5 shadow-sm">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-sans-medium text-muted-foreground flex-1 pr-4 text-[15px]" numberOfLines={1}>
                {listing.title}
              </Text>
              <Text className="font-sans-semibold text-primary text-[15px]">
                {itemPrice.toFixed(2)} GHS
              </Text>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="font-sans-medium text-muted-foreground mr-2 text-[15px]">Escrow Fee</Text>
                <Feather name="shield" size={14} color="#10b981" />
              </View>
              <Text className="font-sans-semibold text-primary text-[15px]">
                {ESCROW_FEE.toFixed(2)} GHS
              </Text>
            </View>

            <View className="bg-border mb-3 h-px w-full" />

            <View className="flex-row items-center justify-between">
              <Text className="font-sans-bold text-primary text-lg">Total</Text>
              <Text className="font-sans-extrabold text-xl text-green-600">
                {total.toFixed(2)} GHS
              </Text>
            </View>
          </View>

          <View className="mb-4">
            <Text className="font-sans-semibold text-primary text-sm mb-2">Mobile Money Number</Text>
            <View className="border-border bg-card h-14 flex-row items-center rounded-xl border px-4 shadow-sm">
              <Feather name="smartphone" size={20} color="#64748b" />
              <TextInput
                className="font-sans-medium text-primary ml-3 h-full flex-1 text-base"
                placeholder="024 123 4567"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={momoNumber}
                onChangeText={setMomoNumber}
                maxLength={10}
                editable={!isProcessing}
                autoFocus
              />
            </View>
          </View>

          <View className="mb-auto flex-row items-center rounded-xl border border-green-100 bg-green-50 p-3">
            <Feather name="lock" size={18} color="#15803d" />
            <Text className="font-sans-medium text-xs text-green-800 flex-1 ml-2">
              Funds held securely in Escrow until you scan the gate pass at pickup.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handlePayment}
            disabled={isProcessing}
            className={`w-full flex-row items-center justify-center gap-2 rounded-xl h-14 shadow-sm ${
              isProcessing ? 'bg-green-800' : 'bg-green-600'
            }`}>
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Text className="font-sans-bold text-base text-white">Confirm & Pay</Text>
                <Feather name="arrow-right" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
