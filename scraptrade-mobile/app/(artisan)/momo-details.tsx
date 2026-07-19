import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { showAlert } from '../../utils/alert';

type MomoWallet = {
  id: number;
  label: string;
  msisdn: string;
  isDefault: boolean;
};

export default function MoMoDetails() {
  const router = useRouter();
  const [wallets, setWallets] = useState<MomoWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<MomoWallet | null>(null);
  const [label, setLabel] = useState('');
  const [msisdn, setMsisdn] = useState('');

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
    setModalVisible(true);
  };

  const openEdit = (wallet: MomoWallet) => {
    setEditing(wallet);
    setLabel(wallet.label ?? '');
    setMsisdn(wallet.msisdn ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (msisdn.replace(/\D/g, '').length < 10) {
      showAlert('Invalid Number', 'Please enter a valid 10-digit MoMo number.');
      return;
    }
    setIsSaving(true);
    try {
      const payload = { label: label.trim() || 'MTN MoMo', msisdn: msisdn.trim() };
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
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Mobile Money</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 pt-6 pb-12"
          showsVerticalScrollIndicator={false}>
          <Text className="text-sm font-sans-medium text-muted-foreground mb-6">
            Manage your saved Mobile Money wallets for faster checkouts.
          </Text>

          {wallets.length === 0 ? (
            <View className="items-center py-12">
              <View className="h-16 w-16 bg-accent/10 rounded-full items-center justify-center mb-4">
                <Feather name="credit-card" size={28} color="#6366f1" />
              </View>
              <Text className="text-base font-sans-bold text-primary mb-1">No wallets yet</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground text-center">
                Add a MoMo wallet to check out faster.
              </Text>
            </View>
          ) : (
            wallets.map((wallet) => (
              <View
                key={wallet.id}
                className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
                {wallet.isDefault && (
                  <View className="absolute top-0 right-0 bg-emerald-100 px-3 py-1 rounded-bl-xl border-b border-l border-emerald-200">
                    <Text className="text-xs font-sans-bold text-emerald-700">DEFAULT</Text>
                  </View>
                )}

                <View className="flex-row items-center mb-4">
                  <View className="h-12 w-12 bg-yellow-400 rounded-full items-center justify-center mr-4 border-2 border-white shadow-sm">
                    <Text className="text-sm font-sans-extrabold text-black">MTN</Text>
                  </View>
                  <View>
                    <Text className="text-lg font-sans-bold text-primary">{wallet.label}</Text>
                    <Text className="text-base font-sans-medium text-muted-foreground mt-0.5">
                      {wallet.msisdn}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-4 border-t border-border">
                  {!wallet.isDefault ? (
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleSetDefault(wallet)}>
                      <Feather name="check-circle" size={16} color="#10b981" />
                      <Text className="text-sm font-sans-bold text-emerald-600 ml-2">Set default</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="flex-row items-center mr-5"
                      onPress={() => openEdit(wallet)}>
                      <Feather name="edit-2" size={16} color="#6366f1" />
                      <Text className="text-sm font-sans-bold text-accent ml-2">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleRemove(wallet)}>
                      <Feather name="trash-2" size={16} color="#ef4444" />
                      <Text className="text-sm font-sans-bold text-red-500 ml-2">Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity
            onPress={openAdd}
            className="w-full flex-row items-center justify-center rounded-2xl bg-accent/10 border border-accent/20 py-4 mt-4 shadow-sm">
            <Feather name="plus" size={20} color="#6366f1" />
            <Text className="text-base font-sans-bold text-accent ml-2">Add New Wallet</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-[32px] px-6 pt-4 pb-10">
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 bg-border rounded-full" />
            </View>
            <Text className="text-xl font-sans-bold text-primary mb-6">
              {editing ? 'Edit Wallet' : 'Add Wallet'}
            </Text>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Label</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={label}
                onChangeText={setLabel}
                placeholder="e.g. Personal MTN"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="gap-2 mb-6">
              <Text className="text-sm font-sans-semibold text-primary ml-1">MoMo Number</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={msisdn}
                onChangeText={setMsisdn}
                keyboardType="phone-pad"
                placeholder="024 123 4567"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="flex-1 items-center justify-center rounded-xl bg-muted py-4 border border-border">
                <Text className="text-base font-sans-bold text-primary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSave}
                disabled={isSaving}
                className="flex-1 items-center justify-center rounded-xl bg-accent py-4">
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
