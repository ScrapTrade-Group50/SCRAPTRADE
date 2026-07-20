import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { apiClient } from '../../api/client';
import { showAlert } from '../../utils/alert';
import ScreenHeader from '@/components/ScreenHeader';
import { Button, TextField } from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';
import { validateMomoNumber } from '@/utils/validation';
import { buildGatePassHref } from '@/utils/gatePassRoute';

WebBrowser.maybeCompleteAuthSession();

type Listing = {
  id: number;
  title: string;
  weight: number;
  pricePerUnit: number;
  status: string;
  pickupLocation?: string;
  seller?: {
    companyName?: string;
  };
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
  const colors = useThemeStore((s) => s.colors);
  const { id } = useLocalSearchParams();
  const payInProgressRef = useRef(false);

  const [listing, setListing] = useState<Listing | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [momoNumber, setMomoNumber] = useState('');
  const [momoError, setMomoError] = useState<string | null>(null);
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
      buildGatePassHref({
        code: order.gatePassCode,
        title: listing.title,
        weight: listing.weight,
        amount: order.totalAmount,
        factory: listing.seller?.companyName,
        pickup: listing.pickupLocation,
      })
    );
  };

  const completePaystackCheckout = async (reference: string) => {
    const response = await apiClient.post('/orders/checkout/complete', { reference });
    goToGatePass(response.data);
  };

  const handleSimulatedPayment = async () => {
    const err = validateMomoNumber(momoNumber);
    if (err) {
      setMomoError(err);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await apiClient.post(
        `/orders/checkout?listingId=${id}&momoNumber=${encodeURIComponent(momoNumber.trim())}`
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
      <ThemedSafeAreaView className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedSafeAreaView>
    );
  }

  const itemPrice = listing.pricePerUnit * listing.weight;
  const total = itemPrice + ESCROW_FEE;
  const showVerifyButton = usePaystack && pendingPaystackReference && awaitingPaystackVerify;
  const factoryName = listing.seller?.companyName || 'Verified Factory';
  const pickupLocation = listing.pickupLocation || 'Contact factory for pickup details';

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Secure Checkout" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View className="flex-1 flex-col px-6 pb-6 pt-2">
          <View className="mb-6 rounded-2xl border border-border bg-card p-5">
            <View className="mb-4 flex-row items-start rounded-xl border border-border bg-muted/50 p-3">
              <Feather name="map-pin" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-sans-bold uppercase tracking-wider text-muted-foreground">
                  Pickup from
                </Text>
                <Text className="mt-0.5 text-sm font-sans-semibold text-primary">{factoryName}</Text>
                <Text className="mt-0.5 text-sm font-sans-medium text-muted-foreground">
                  {pickupLocation}
                </Text>
              </View>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text
                className="flex-1 pr-4 text-[15px] font-sans-medium text-muted-foreground"
                numberOfLines={1}>
                {listing.title}
              </Text>
              <Text className="text-[15px] font-sans-semibold text-primary">
                {itemPrice.toFixed(2)} GHS
              </Text>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="mr-2 text-[15px] font-sans-medium text-muted-foreground">
                  Escrow Fee
                </Text>
                <Feather name="shield" size={14} color={colors.success} />
              </View>
              <Text className="text-[15px] font-sans-semibold text-primary">
                {ESCROW_FEE.toFixed(2)} GHS
              </Text>
            </View>

            <View className="mb-3 h-px w-full bg-border" />

            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-sans-bold text-primary">Total</Text>
              <Text className="text-xl font-sans-extrabold text-success">
                {total.toFixed(2)} GHS
              </Text>
            </View>
          </View>

          {!usePaystack && (
            <TextField
              label="Mobile Money Number"
              leftIcon="smartphone"
              placeholder="0241234567"
              keyboardType="phone-pad"
              value={momoNumber}
              error={momoError}
              maxLength={10}
              editable={!isProcessing}
              autoFocus
              containerClassName="mb-4"
              onChangeText={(v) => {
                setMomoNumber(v.replace(/\D/g, '').slice(0, 10));
                setMomoError(null);
              }}
            />
          )}

          {usePaystack ? (
            <View className="mb-4 flex-row items-center rounded-xl border border-accent/25 bg-accent/10 p-3">
              <Feather name="credit-card" size={18} color={colors.accent} />
              <Text className="ml-2 flex-1 text-xs font-sans-medium text-primary">
                Pay securely with Paystack — card, mobile money, or bank. Funds stay in escrow until
                factory pickup.
              </Text>
            </View>
          ) : (
            <View className="mb-4 flex-row items-center rounded-xl border border-border bg-muted p-3">
              <Feather name="info" size={18} color={colors.mutedForeground} />
              <Text className="ml-2 flex-1 text-xs font-sans-medium text-muted-foreground">
                Demo mode: payment is simulated. Set PAYMENT_PROVIDER=paystack on the backend for
                live checkout.
              </Text>
            </View>
          )}

          {showVerifyButton && (
            <View className="mb-4 flex-row items-center rounded-xl border border-accent/25 bg-accent/10 p-3">
              <Feather name="check-circle" size={18} color={colors.accent} />
              <Text className="ml-2 flex-1 text-xs font-sans-medium text-primary">
                Paid on Paystack? Tap Verify payment below to get your gate pass.
              </Text>
            </View>
          )}

          <View className="mb-4 flex-row items-center rounded-xl border border-success/25 bg-success/10 p-3">
            <Feather name="lock" size={18} color={colors.success} />
            <Text className="ml-2 flex-1 text-xs font-sans-medium text-primary">
              Funds held securely in Escrow until the factory scans your gate pass at pickup.
            </Text>
          </View>

          <Button
            label={usePaystack ? 'Pay with Paystack' : 'Confirm & Pay'}
            loading={isProcessing}
            onPress={handlePayment}
          />

          {showVerifyButton && (
            <TouchableOpacity
              onPress={handleVerifyPaystackPayment}
              disabled={isProcessing}
              className="mt-3 h-12 w-full flex-row items-center justify-center rounded-xl border border-border bg-card">
              <Text className="font-sans-semibold text-accent">Verify payment</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
