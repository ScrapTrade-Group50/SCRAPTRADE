import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiClient } from '../../api/client';
import { showAlert } from '../../utils/alert';

WebBrowser.maybeCompleteAuthSession();

type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
};

type PaymentConfig = {
  provider: string;
  paystackEnabled?: boolean;
  publicKey?: string;
};

const ESCROW_FEE = 15;

function getPaystackRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/checkout`;
  }
  // Expo Go: exp://…/--/checkout — standalone builds: scraptrade://checkout
  return Linking.createURL('checkout');
}

function parseReferenceFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('reference') || parsed.searchParams.get('trxref');
  } catch {
    const match = url.match(/[?&](?:reference|trxref)=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }
}

export default function Checkout() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const payInProgressRef = useRef(false);

  const [listing, setListing] = useState<Listing | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPaystackReference, setPendingPaystackReference] = useState<string | null>(null);
  const [awaitingPaystackVerify, setAwaitingPaystackVerify] = useState(false);

  const usePaystack = paymentConfig?.provider === 'paystack' && paymentConfig?.paystackEnabled;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [listingRes, configRes] = await Promise.all([
          apiClient.get(`/listings/${id}`),
          apiClient.get('/payments/config'),
        ]);
        const data = listingRes.data;
        if (data.status !== 'AVAILABLE') {
          showAlert('Unavailable', 'This item is no longer available for purchase.', [
            { text: 'OK', onPress: () => router.back() },
          ]);
          return;
        }
        setListing(data);
        setPaymentConfig(configRes.data);
      } catch {
        showAlert('Error', 'Could not load checkout.', [{ text: 'OK', onPress: () => router.back() }]);
      }
    };
    if (id) fetchData();
  }, [id, router]);

  const goToGatePass = (order: { gatePassCode: string; totalAmount: number }) => {
    if (!listing) return;
    setPendingPaystackReference(null);
    setAwaitingPaystackVerify(false);
    router.replace(
      `/(artisan)/gate-pass?code=${order.gatePassCode}&title=${encodeURIComponent(listing.title)}&weight=${listing.weight}&amount=${order.totalAmount}`
    );
  };

  const completePaystackCheckout = async (reference: string) => {
    const response = await apiClient.post('/orders/checkout/complete', { reference });
    goToGatePass(response.data);
  };

  const handleSimulatedPayment = async () => {
    if (momoNumber.length < 10) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit MoMo number.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.post(
        `/orders/checkout?listingId=${id}&momoNumber=${encodeURIComponent(momoNumber)}`
      );
      goToGatePass(response.data);
    } catch (error: any) {
      showAlert(
        'Payment Failed',
        error.response?.data?.message || 'Could not complete transaction.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const tryCompletePaystack = async (reference: string, showFailureHint: boolean) => {
    try {
      await completePaystackCheckout(reference);
      return true;
    } catch (error: any) {
      if (showFailureHint) {
        setAwaitingPaystackVerify(true);
        showAlert(
          'Finish your order',
          error.response?.data?.message ||
            'If Paystack shows payment successful, tap "Verify payment" below.'
        );
      }
      return false;
    }
  };

  const handlePaystackPayment = async () => {
    if (payInProgressRef.current) return;
    payInProgressRef.current = true;
    setIsProcessing(true);
    setAwaitingPaystackVerify(false);

    try {
      const redirectUrl = getPaystackRedirectUrl();
      const initRes = await apiClient.post(
        `/orders/checkout/init?listingId=${id}&callbackUrl=${encodeURIComponent(redirectUrl)}`
      );
      const { authorizationUrl, reference } = initRes.data;
      setPendingPaystackReference(reference);

      if (Platform.OS === 'web') {
        window.open(authorizationUrl, '_blank', 'noopener,noreferrer');
        setAwaitingPaystackVerify(true);
        showAlert(
          'Complete payment',
          'Pay in the browser tab that opened, then tap "Verify payment" below.'
        );
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, redirectUrl);

      if (result.type === 'success') {
        const paidReference = parseReferenceFromUrl(result.url) || reference;
        await completePaystackCheckout(paidReference);
        return;
      }

      // Manual return or redirect missed — payment may still have succeeded on Paystack
      await tryCompletePaystack(reference, true);
    } catch (error: any) {
      showAlert(
        'Payment Failed',
        error.response?.data?.message || error.message || 'Could not complete Paystack payment.'
      );
    } finally {
      payInProgressRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleVerifyPaystackPayment = async () => {
    if (!pendingPaystackReference) {
      showAlert('No payment in progress', 'Tap Pay with Paystack first.');
      return;
    }
    setIsProcessing(true);
    try {
      await completePaystackCheckout(pendingPaystackReference);
    } catch (error: any) {
      showAlert(
        'Verification failed',
        error.response?.data?.message || 'Payment not found or not completed yet.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = () => {
    if (usePaystack) {
      handlePaystackPayment();
    } else {
      handleSimulatedPayment();
    }
  };

  if (!listing) {
    return (
      <SafeAreaView className="bg-background flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    );
  }

  const itemPrice = listing.pricePerUnit * listing.weight;
  const total = itemPrice + ESCROW_FEE;
  const showVerifyButton = usePaystack && pendingPaystackReference && awaitingPaystackVerify;

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
              <Text
                className="font-sans-medium text-muted-foreground flex-1 pr-4 text-[15px]"
                numberOfLines={1}>
                {listing.title}
              </Text>
              <Text className="font-sans-semibold text-primary text-[15px]">
                {itemPrice.toFixed(2)} GHS
              </Text>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="font-sans-medium text-muted-foreground mr-2 text-[15px]">
                  Escrow Fee
                </Text>
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

          {!usePaystack && (
            <View className="mb-4">
              <Text className="font-sans-semibold text-primary text-sm mb-2">
                Mobile Money Number
              </Text>
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
          )}

          {usePaystack ? (
            <View className="mb-4 flex-row items-center rounded-xl border border-blue-100 bg-blue-50 p-3">
              <Feather name="credit-card" size={18} color="#1d4ed8" />
              <Text className="font-sans-medium text-xs text-blue-900 flex-1 ml-2">
                Pay securely with Paystack — card, mobile money, or bank. Funds stay in escrow until
                factory pickup.
              </Text>
            </View>
          ) : (
            <View className="mb-4 flex-row items-center rounded-xl border border-amber-100 bg-amber-50 p-3">
              <Feather name="info" size={18} color="#b45309" />
              <Text className="font-sans-medium text-xs text-amber-900 flex-1 ml-2">
                Demo mode: payment is simulated. Set PAYMENT_PROVIDER=paystack on the backend for live
                checkout.
              </Text>
            </View>
          )}

          {showVerifyButton && (
            <View className="mb-4 flex-row items-center rounded-xl border border-indigo-100 bg-indigo-50 p-3">
              <Feather name="check-circle" size={18} color="#4338ca" />
              <Text className="font-sans-medium text-xs text-indigo-900 flex-1 ml-2">
                Paid on Paystack? Tap Verify payment below to get your gate pass.
              </Text>
            </View>
          )}

          <View className="mb-4 flex-row items-center rounded-xl border border-green-100 bg-green-50 p-3">
            <Feather name="lock" size={18} color="#15803d" />
            <Text className="font-sans-medium text-xs text-green-800 flex-1 ml-2">
              Funds held securely in Escrow until the factory scans your gate pass at pickup.
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
                <Text className="font-sans-bold text-base text-white">
                  {usePaystack ? 'Pay with Paystack' : 'Confirm & Pay'}
                </Text>
                <Feather name="arrow-right" size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          {showVerifyButton && (
            <TouchableOpacity
              onPress={handleVerifyPaystackPayment}
              disabled={isProcessing}
              className="mt-3 w-full flex-row items-center justify-center rounded-xl border border-blue-200 bg-white h-12">
              <Text className="font-sans-semibold text-blue-700">Verify payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
