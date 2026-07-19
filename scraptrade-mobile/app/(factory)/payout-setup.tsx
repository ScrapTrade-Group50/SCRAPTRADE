import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '@/store/authStore';
import { showAlert } from '../../utils/alert';

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
  const companyName = useAuthStore((s) => s.companyName);

  const [status, setStatus] = useState<PayoutStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [accountName, setAccountName] = useState(companyName ?? '');
  const [msisdn, setMsisdn] = useState('');
  const [provider, setProvider] = useState('MTN');

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

  const handleSetup = async () => {
    if (msisdn.replace(/\D/g, '').length < 10) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit MoMo number.');
      return;
    }
    setIsSaving(true);
    try {
      const response = await apiClient.post('/payouts/setup', {
        accountName: accountName.trim() || companyName,
        msisdn: msisdn.trim(),
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
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  if (!status?.paystackEnabled) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <View className="flex-row items-center px-6 py-4 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0b1f1a" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-primary">Payout Account</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-muted-foreground font-sans-medium">
            Paystack payouts are not enabled on this server.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Payout Account</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView contentContainerClassName="px-6 pt-6 pb-12" showsVerticalScrollIndicator={false}>
          <View className="mb-6 flex-row items-start rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Feather name="info" size={20} color="#1d4ed8" />
            <Text className="ml-3 flex-1 text-sm font-sans-medium text-blue-900">
              Buyer payments stay in SCRAPTRADE escrow until you scan a gate pass. Funds are then
              transferred to this MoMo wallet (minus the platform escrow fee).
            </Text>
          </View>

          {status.configured && (
            <View className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <View className="flex-row items-center mb-2">
                <Feather name="check-circle" size={20} color="#059669" />
                <Text className="ml-2 font-sans-bold text-emerald-800">Payout active</Text>
              </View>
              <Text className="font-sans-medium text-emerald-900">{status.accountLabel}</Text>
              <Text className="mt-2 text-xs font-sans-medium text-emerald-700">
                Update below to change where escrow releases are sent.
              </Text>
            </View>
          )}

          <Text className="text-sm font-sans-semibold text-primary mb-2 ml-1">Account name</Text>
          <TextInput
            className="mb-4 rounded-xl border border-border bg-card px-4 py-4 font-sans-medium text-primary"
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Factory or business name"
            placeholderTextColor="#94a3b8"
          />

          <Text className="text-sm font-sans-semibold text-primary mb-2 ml-1">Network</Text>
          <View className="mb-4 flex-row flex-wrap gap-2">
            {PROVIDERS.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setProvider(item.id)}
                className={`rounded-full border px-4 py-2 ${
                  provider === item.id ? 'border-accent bg-accent/10' : 'border-border bg-card'
                }`}>
                <Text
                  className={`font-sans-semibold text-sm ${
                    provider === item.id ? 'text-accent' : 'text-muted-foreground'
                  }`}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-sm font-sans-semibold text-primary mb-2 ml-1">MoMo number</Text>
          <TextInput
            className="mb-6 rounded-xl border border-border bg-card px-4 py-4 font-sans-medium text-primary"
            value={msisdn}
            onChangeText={setMsisdn}
            keyboardType="phone-pad"
            placeholder="024 123 4567"
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            onPress={handleSetup}
            disabled={isSaving}
            className={`w-full flex-row items-center justify-center rounded-xl py-4 ${
              isSaving ? 'bg-accent/70' : 'bg-accent'
            }`}>
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-sans-bold text-base text-white">
                {status.configured ? 'Update payout account' : 'Link payout account'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
