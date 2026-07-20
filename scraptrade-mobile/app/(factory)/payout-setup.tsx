import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '@/store/authStore';
import { showAlert } from '../../utils/alert';
import ScreenHeader from '@/components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Button, TextField } from '@/components/ui';
import {
  validateMomoNumber,
  validateRequiredText,
  type FieldErrors,
  hasErrors,
} from '@/utils/validation';

type PayoutFields = 'accountName' | 'msisdn';

type PayoutStatus = {
  paystackEnabled: boolean;
  configured: boolean;
  accountLabel: string;
};

const PROVIDERS = [
  { id: 'MTN', label: 'MTN MoMo' },
  { id: 'VOD', label: 'Telecel Cash' },
  { id: 'TIG', label: 'AirtelTigo Money' },
];

export default function PayoutSetup() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const companyName = useAuthStore((s) => s.companyName);

  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountName, setAccountName] = useState(companyName ?? '');
  const [msisdn, setMsisdn] = useState('');
  const [provider, setProvider] = useState('MTN');
  const [errors, setErrors] = useState<FieldErrors<PayoutFields>>({});

  const loadStatus = async () => {
    try {
      const response = await apiClient.get('/payouts/status');
      setStatus(response.data);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not load payout status.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      loadStatus();
    }, [])
  );

  const validate = () => {
    const next: FieldErrors<PayoutFields> = {
      accountName: validateRequiredText(accountName, 'Account name', { min: 2 }) ?? undefined,
      msisdn: validateMomoNumber(msisdn) ?? undefined,
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const handleSetup = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const response = await apiClient.post('/payouts/setup', {
        accountName: accountName.trim(),
        msisdn: msisdn.trim().replace(/\s+/g, ''),
        provider,
      });
      showAlert('Payout linked', response.data.message, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      showAlert('Setup failed', error.response?.data?.message || 'Could not link payout account.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedSafeAreaView>
    );
  }

  if (!status?.paystackEnabled) {
    return (
      <ThemedSafeAreaView edges={['top']}>
        <ScreenHeader title="Payout Account" />
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center font-sans-medium" style={theme.textMuted}>
            Paystack payouts are not enabled on this server.
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Payout Account" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerClassName="px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row items-start rounded-xl border p-4" style={theme.accentSoft}>
            <Feather name="info" size={20} color={colors.accent} />
            <Text className="ml-3 flex-1 text-sm font-sans-medium" style={theme.textPrimary}>
              Buyer payments stay in SCRAPTRADE escrow until you scan a gate pass. Funds are then
              transferred to this MoMo wallet (minus the platform escrow fee).
            </Text>
          </View>

          {status.configured && (
            <View className="mb-6 rounded-2xl border p-5" style={theme.successSoft}>
              <View className="mb-2 flex-row items-center">
                <Feather name="check-circle" size={20} color={colors.success} />
                <Text className="ml-2 font-sans-bold" style={theme.textSuccess}>
                  Payout active
                </Text>
              </View>
              <Text className="font-sans-medium" style={theme.textPrimary}>
                {status.accountLabel}
              </Text>
              <Text className="mt-2 text-xs font-sans-medium" style={theme.textSuccess}>
                Update below to change where escrow releases are sent.
              </Text>
            </View>
          )}

          <TextField
            label="Account name"
            leftIcon="user"
            containerClassName="mb-4"
            value={accountName}
            error={errors.accountName}
            placeholder="Factory or business name"
            onChangeText={(v) => {
              setAccountName(v);
              setErrors((e) => ({ ...e, accountName: undefined }));
            }}
          />

          <Text className="mb-2 ml-1 text-sm font-sans-semibold" style={theme.textPrimary}>
            Network
          </Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {PROVIDERS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setProvider(item.id)}
                className="rounded-full border px-4 py-2"
                style={
                  provider === item.id
                    ? { ...theme.accentSoft, borderColor: colors.accent }
                    : theme.card
                }>
                <Text
                  className="font-sans-semibold text-sm"
                  style={provider === item.id ? theme.textAccent : theme.textMuted}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextField
            label="MoMo number"
            leftIcon="phone"
            containerClassName="mb-6"
            value={msisdn}
            error={errors.msisdn}
            keyboardType="phone-pad"
            placeholder="0241234567"
            textContentType="telephoneNumber"
            onChangeText={(v) => {
              setMsisdn(v);
              setErrors((e) => ({ ...e, msisdn: undefined }));
            }}
          />

          <Button
            label={status.configured ? 'Update payout account' : 'Link payout account'}
            loading={isSaving}
            onPress={handleSetup}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
