import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';
import { ROUTES } from '@/utils/routes';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import ScreenHeader from '@/components/ScreenHeader';
import { Button } from '@/components/ui';
import GatePassQrCode from '@/components/GatePassQrCode';
import { firstSearchParam, formatPickupLine } from '@/utils/gatePassRoute';

type OrderSummary = {
  status: string;
  gatePassCode: string;
  listing?: {
    title: string;
    weight: number;
    pickupLocation?: string;
    seller?: {
      companyName?: string;
    };
  };
};

type PickupPhase = 'awaiting' | 'completed';

const POLL_MS = 3000;

export default function GatePass() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const { code, title, weight, amount, factory, pickup } = useLocalSearchParams();

  const qrString = (firstSearchParam(code) || 'QR-ERROR').toUpperCase();
  const displayTitle = firstSearchParam(title) || 'Scrap Material';
  const displayWeight = firstSearchParam(weight) || '--';
  const displayAmount = Number(firstSearchParam(amount));
  const amountLabel = Number.isFinite(displayAmount) ? displayAmount.toFixed(2) : '--';

  const [phase, setPhase] = useState<PickupPhase>('awaiting');
  const [orderListing, setOrderListing] = useState<OrderSummary['listing'] | null>(null);

  useEffect(() => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const syncPickupStatus = async () => {
      try {
        const response = await apiClient.get<OrderSummary[]>('/orders/my-orders');
        if (cancelled) return;

        const order = response.data.find(
          (item) => item.gatePassCode?.trim().toUpperCase() === qrString
        );

        if (order?.listing) {
          setOrderListing(order.listing);
        }

        if (order?.status === 'COMPLETED') {
          setPhase('completed');
          if (intervalId) clearInterval(intervalId);
        }
      } catch {
        // Keep showing the gate pass even if status sync fails.
      }
    };

    syncPickupStatus();
    intervalId = setInterval(syncPickupStatus, POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [qrString]);

  const pickupLine = formatPickupLine(
    firstSearchParam(factory) || orderListing?.seller?.companyName,
    firstSearchParam(pickup) || orderListing?.pickupLocation
  );

  const handleLeave = () => router.replace(ROUTES.artisanFeed);
  const isCompleted = phase === 'completed';

  return (
    <ThemedSafeAreaView edges={['top', 'bottom']}>
      <ScreenHeader
        title="Gate Pass"
        subtitle={isCompleted ? 'Pickup complete' : 'Present at factory gate'}
        onBack={handleLeave}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <View className="mb-5 items-center">
          <View
            className="mb-3 h-14 w-14 items-center justify-center rounded-full"
            style={isCompleted ? { backgroundColor: colors.success } : theme.accentSoft}>
            <Feather
              name={isCompleted ? 'check' : 'smartphone'}
              size={isCompleted ? 28 : 22}
              color={isCompleted ? '#FFFFFF' : colors.accent}
            />
          </View>
          <Text className="text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            {isCompleted ? 'Pickup Confirmed' : 'Awaiting Pickup'}
          </Text>
          <Text
            className="mt-1 text-center text-sm font-sans-medium"
            style={[theme.textMuted, { maxWidth: 280 }]}>
            {isCompleted
              ? 'The factory scanned your gate pass. Your order is complete.'
              : 'Show this code at the factory gate to collect your materials.'}
          </Text>
        </View>

        <View className="rounded-3xl border p-5" style={theme.card}>
          {!isCompleted ? (
            <>
              <GatePassQrCode value={qrString} />

              <View className="mt-5 items-center">
                <Text
                  className="text-[11px] font-sans-bold uppercase tracking-widest"
                  style={theme.textMuted}>
                  Pickup code
                </Text>
                <Text
                  className="mt-1 text-center text-xl font-sans-extrabold tracking-wide"
                  style={theme.textPrimary}
                  selectable>
                  {qrString}
                </Text>
              </View>

              <View className="my-5 h-px w-full" style={{ backgroundColor: colors.border }} />
            </>
          ) : (
            <View
              className="mb-5 flex-row items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={theme.successSoft}>
              <Feather name="shield" size={18} color={colors.success} />
              <Text className="flex-1 text-sm font-sans-semibold" style={theme.textSuccess}>
                Escrow released after pickup
              </Text>
            </View>
          )}

          {pickupLine ? (
            <View
              className="mb-4 flex-row items-start rounded-xl border p-3"
              style={{ ...theme.cardMuted, borderColor: colors.border }}>
              <Feather
                name="map-pin"
                size={16}
                color={colors.mutedForeground}
                style={{ marginTop: 2 }}
              />
              <View className="ml-2 flex-1">
                <Text
                  className="text-xs font-sans-bold uppercase tracking-wider"
                  style={theme.textMuted}>
                  Collect from
                </Text>
                <Text className="mt-0.5 text-sm font-sans-medium" style={theme.textPrimary}>
                  {pickupLine}
                </Text>
              </View>
            </View>
          ) : null}

          <View
            className="flex-row items-center justify-between rounded-xl border px-4 py-3"
            style={{ backgroundColor: colors.background, borderColor: colors.border }}>
            <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <Text className="text-base font-sans-bold" style={theme.textPrimary} numberOfLines={2}>
                {displayTitle}
              </Text>
              <Text className="mt-0.5 text-sm font-sans-medium" style={theme.textMuted}>
                {displayWeight} kg
              </Text>
            </View>
            <Text className="text-base font-sans-extrabold" style={theme.textSuccess}>
              GHS {amountLabel}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 20, gap: 12 }}>
          {!isCompleted ? (
            <>
              <View
                className="flex-row items-center justify-center gap-2 rounded-xl border px-4 py-3"
                style={theme.accentSoft}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text className="text-sm font-sans-medium" style={theme.textAccent}>
                  Waiting for factory to scan…
                </Text>
              </View>
              <View className="flex-row items-center justify-center gap-1.5 px-2">
                <Feather name="lock" size={12} color={colors.mutedForeground} />
                <Text className="text-center text-xs font-sans-medium" style={theme.textMuted}>
                  Do not share — this code claims your materials
                </Text>
              </View>
            </>
          ) : null}

          <Button
            label={isCompleted ? 'Back to Discover' : 'Leave — keep in Orders'}
            variant={isCompleted ? 'primary' : 'secondary'}
            onPress={handleLeave}
          />
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
