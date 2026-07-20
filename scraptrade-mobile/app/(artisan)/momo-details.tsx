import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { showAlert } from '../../utils/alert';
import ScreenHeader from '@/components/ScreenHeader';
import { Button, TextField } from '@/components/ui';
import {
  validateMomoNumber,
  validateRequiredText,
  type FieldErrors,
  hasErrors,
} from '@/utils/validation';

type WalletFields = 'label' | 'msisdn';

type MomoWallet = {
  id: number;
  label: string;
  msisdn: string;
  isDefault: boolean;
};

export default function MoMoDetails() {
  const theme = useScreenTheme();
  const { colors } = theme;
  const [wallets, setWallets] = useState<MomoWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<MomoWallet | null>(null);
  const [label, setLabel] = useState('');
  const [msisdn, setMsisdn] = useState('');
  const [errors, setErrors] = useState<FieldErrors<WalletFields>>({});

  const fetchWallets = async () => {
    try {
      const response = await apiClient.get('/momo-wallets');
      setWallets(response.data);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not load your wallets.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchWallets();
    }, [])
  );

  const openAdd = () => {
    setEditing(null);
    setLabel('');
    setMsisdn('');
    setErrors({});
    setModalVisible(true);
  };

  const openEdit = (wallet: MomoWallet) => {
    setEditing(wallet);
    setLabel(wallet.label ?? '');
    setMsisdn(wallet.msisdn ?? '');
    setErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const next: FieldErrors<WalletFields> = {
      label: validateRequiredText(label, 'Label', { min: 2 }) ?? undefined,
      msisdn: validateMomoNumber(msisdn) ?? undefined,
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = {
        label: label.trim(),
        msisdn: msisdn.trim().replace(/\s+/g, ''),
      };
      if (editing) {
        await apiClient.put(`/momo-wallets/${editing.id}`, payload);
      } else {
        await apiClient.post('/momo-wallets', payload);
      }
      setModalVisible(false);
      fetchWallets();
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not save wallet.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetDefault = async (wallet: MomoWallet) => {
    if (wallet.isDefault) return;
    setWallets((prev) => prev.map((w) => ({ ...w, isDefault: w.id === wallet.id })));
    try {
      await apiClient.patch(`/momo-wallets/${wallet.id}/default`);
    } catch {
      fetchWallets();
    }
  };

  const handleRemove = (wallet: MomoWallet) => {
    showAlert('Remove Wallet', `Remove ${wallet.label} (${wallet.msisdn})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/momo-wallets/${wallet.id}`);
            fetchWallets();
          } catch (error: any) {
            showAlert('Error', error.response?.data?.message || 'Could not remove wallet.');
          }
        },
      },
    ]);
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Mobile Money" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 pt-6 pb-12"
          showsVerticalScrollIndicator={false}>
          <Text className="text-sm font-sans-medium mb-6" style={theme.textMuted}>
            Manage your saved Mobile Money wallets for faster checkouts.
          </Text>

          {wallets.length === 0 ? (
            <View className="items-center py-12">
              <View
                className="h-16 w-16 rounded-full items-center justify-center mb-4"
                style={theme.accentSoft}>
                <Feather name="credit-card" size={28} color={colors.accent} />
              </View>
              <Text className="text-base font-sans-bold mb-1" style={theme.textPrimary}>
                No wallets yet
              </Text>
              <Text className="text-sm font-sans-medium text-center" style={theme.textMuted}>
                Add a MoMo wallet to check out faster.
              </Text>
            </View>
          ) : (
            wallets.map((wallet) => (
              <View
                key={wallet.id}
                className="rounded-2xl border p-5 mb-4 shadow-sm relative overflow-hidden"
                style={theme.card}>
                {wallet.isDefault && (
                  <View
                    className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl border-b border-l"
                    style={theme.successSoft}>
                    <Text className="text-xs font-sans-bold" style={theme.textSuccess}>
                      DEFAULT
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center mb-4">
                  <View
                    className="h-12 w-12 rounded-full items-center justify-center mr-4 border-2 shadow-sm"
                    style={{ backgroundColor: '#FACC15', borderColor: colors.card }}>
                    <Text className="text-sm font-sans-extrabold text-black">MTN</Text>
                  </View>
                  <View>
                    <Text className="text-lg font-sans-bold" style={theme.textPrimary}>
                      {wallet.label}
                    </Text>
                    <Text className="text-base font-sans-medium mt-0.5" style={theme.textMuted}>
                      {wallet.msisdn}
                    </Text>
                  </View>
                </View>

                <View
                  className="flex-row items-center justify-between pt-4 border-t"
                  style={{ borderTopColor: colors.border }}>
                  {!wallet.isDefault ? (
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleSetDefault(wallet)}>
                      <Feather name="check-circle" size={16} color={colors.success} />
                      <Text className="text-sm font-sans-bold ml-2" style={theme.textSuccess}>
                        Set default
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="flex-row items-center mr-5"
                      onPress={() => openEdit(wallet)}>
                      <Feather name="edit-2" size={16} color={colors.accent} />
                      <Text className="text-sm font-sans-bold ml-2" style={theme.textAccent}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleRemove(wallet)}>
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                      <Text
                        className="text-sm font-sans-bold ml-2"
                        style={{ color: colors.destructive }}>
                        Remove
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            onPress={openAdd}
            className="w-full flex-row items-center justify-center rounded-2xl border py-4 mt-4 shadow-sm"
            style={theme.accentSoft}>
            <Feather name="plus" size={20} color={colors.accent} />
            <Text className="text-base font-sans-bold ml-2" style={theme.textAccent}>
              Add New Wallet
            </Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          style={theme.modalOverlay}>
          <View
            className="rounded-t-[32px] px-6 pt-4 pb-10"
            style={[theme.varStyle, { backgroundColor: colors.background }]}>
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>
            <Text className="text-xl font-sans-bold mb-6" style={theme.textPrimary}>
              {editing ? 'Edit Wallet' : 'Add Wallet'}
            </Text>

            <View className="gap-4 mb-6">
              <TextField
                label="Label"
                leftIcon="tag"
                value={label}
                error={errors.label}
                placeholder="e.g. Personal MTN"
                onChangeText={(v) => {
                  setLabel(v);
                  setErrors((e) => ({ ...e, label: undefined }));
                }}
              />
              <TextField
                label="MoMo Number"
                leftIcon="phone"
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
            </View>

            <View className="flex-row gap-3">
              <Button
                label="Cancel"
                variant="secondary"
                className="flex-1"
                onPress={() => setModalVisible(false)}
              />
              <Button
                label="Save"
                className="flex-1"
                loading={isSaving}
                onPress={handleSave}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedSafeAreaView>
  );
}
