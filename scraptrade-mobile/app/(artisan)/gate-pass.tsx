import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';
import { apiClient } from '../../api/client';
import { ROUTES } from '@/utils/routes';

type OrderSummary = {
  status: string;
  gatePassCode: string;
};

type PickupPhase = 'loading' | 'awaiting' | 'completed';

const POLL_MS = 3000;

export default function GatePass() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { code, title, weight, amount } = useLocalSearchParams();

  const qrString = ((code as string) || 'QR-ERROR').trim().toUpperCase();
  const displayTitle = (title as string) || 'Scrap Material';
  const displayWeight = (weight as string) || '--';
  const displayAmount = Number(amount as string);
  const amountLabel = Number.isFinite(displayAmount) ? displayAmount.toFixed(2) : '--';

  const [phase, setPhase] = useState<PickupPhase>('loading');

  const qrSize = Math.min(200, Math.max(160, width - 120));

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

        if (order?.status === 'COMPLETED') {
          setPhase('completed');
          if (intervalId) clearInterval(intervalId);
        } else {
          setPhase('awaiting');
        }
      } catch {
        if (!cancelled) {
          setPhase((current) => (current === 'completed' ? 'completed' : 'awaiting'));
        }
      }
    };

    syncPickupStatus();
    intervalId = setInterval(syncPickupStatus, POLL_MS);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [qrString]);

  const summaryCard = (
    <View style={styles.summaryRow}>
      <View style={styles.summaryLeft}>
        <Text style={styles.itemTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        <Text style={styles.itemMeta}>{displayWeight} kg</Text>
      </View>
      <Text style={styles.itemPrice}>GHS {amountLabel}</Text>
    </View>
  );

  if (phase === 'loading') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingBody}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      </SafeAreaView>
    );
  }

  if (phase === 'completed') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.screen}>
          <View style={styles.status}>
            <View style={styles.checkCircle}>
              <Feather name="check" size={28} color="#ffffff" />
            </View>
            <Text style={styles.statusTitle}>Pickup Confirmed</Text>
            <Text style={styles.statusSubtitle}>
              The factory scanned your gate pass. Your order is complete.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.confirmedBadge}>
              <Feather name="shield" size={18} color="#15803d" />
              <Text style={styles.confirmedBadgeText}>Escrow released after pickup</Text>
            </View>
            <View style={styles.divider} />
            {summaryCard}
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => router.replace(ROUTES.artisanFeed)}
              style={styles.cta}
              activeOpacity={0.85}>
              <Text style={styles.ctaText}>Back to Discover</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.screen}>
        <View style={styles.status}>
          <View style={styles.awaitingCircle}>
            <Feather name="smartphone" size={22} color="#6366f1" />
          </View>
          <Text style={styles.statusTitle}>Awaiting Pickup</Text>
          <Text style={styles.statusSubtitle}>Show this QR code at the factory gate</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.qrWrap}>
            <QRCode value={qrString} size={qrSize} color="#0b1f1a" backgroundColor="#ffffff" />
          </View>

          <Text style={styles.codeLabel}>PICKUP CODE</Text>
          <Text style={styles.code} selectable>
            {qrString}
          </Text>

          <View style={styles.divider} />
          {summaryCard}
        </View>

        <View style={styles.footer}>
          <View style={styles.waitRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.waitText}>Waiting for factory to scan…</Text>
          </View>
          <View style={styles.lockRow}>
            <Feather name="lock" size={12} color="#6b7280" />
            <Text style={styles.lockText}>Do not share — this code claims your materials</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.replace(ROUTES.artisanFeed)}
            style={styles.secondaryCta}
            activeOpacity={0.85}>
            <Text style={styles.secondaryCtaText}>Leave — keep in Orders</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f4f7f5',
  },
  loadingBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  status: {
    alignItems: 'center',
  },
  checkCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  awaitingCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 22,
    fontFamily: 'sans-extrabold',
    color: '#0b1f1a',
    textAlign: 'center',
  },
  statusSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    shadowColor: '#0b1f1a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'stretch',
  },
  confirmedBadgeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'sans-semibold',
    color: '#15803d',
  },
  qrWrap: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  codeLabel: {
    marginTop: 18,
    fontSize: 11,
    fontFamily: 'sans-bold',
    color: '#6b7280',
    letterSpacing: 2,
  },
  code: {
    marginTop: 4,
    fontSize: 22,
    fontFamily: 'sans-extrabold',
    color: '#0b1f1a',
    letterSpacing: 1.5,
  },
  divider: {
    alignSelf: 'stretch',
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 18,
  },
  summaryRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLeft: {
    flex: 1,
    paddingRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontFamily: 'sans-bold',
    color: '#0b1f1a',
  },
  itemMeta: {
    marginTop: 2,
    fontSize: 13,
    fontFamily: 'sans-medium',
    color: '#6b7280',
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: 'sans-extrabold',
    color: '#0b1f1a',
  },
  footer: {
    gap: 12,
  },
  waitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  waitText: {
    fontSize: 13,
    fontFamily: 'sans-medium',
    color: '#6366f1',
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockText: {
    fontSize: 12,
    fontFamily: 'sans-medium',
    color: '#6b7280',
    textAlign: 'center',
  },
  cta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0b1f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: '#ffffff',
  },
  secondaryCta: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryCtaText: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: '#0b1f1a',
  },
});
