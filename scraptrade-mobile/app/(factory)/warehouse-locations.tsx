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
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../../api/client';
import { showAlert } from '../../utils/alert';
import ScreenHeader from '@/components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Button, TextField } from '@/components/ui';
import {
  validateRequiredText,
  validateOptionalText,
  type FieldErrors,
  hasErrors,
} from '@/utils/validation';

type LocationFields = 'name' | 'address';

type WarehouseLocation = {
  id: number;
  name: string;
  address: string | null;
  isPrimary: boolean;
};

export default function WarehouseLocations() {
  const theme = useScreenTheme();
  const { colors } = theme;
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<FieldErrors<LocationFields>>({});

  const fetchLocations = async () => {
    try {
      const response = await apiClient.get('/warehouse-locations');
      setLocations(response.data);
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not load your locations.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchLocations();
    }, [])
  );

  const openAdd = () => {
    setEditing(null);
    setName('');
    setAddress('');
    setErrors({});
    setModalVisible(true);
  };

  const openEdit = (location: WarehouseLocation) => {
    setEditing(location);
    setName(location.name ?? '');
    setAddress(location.address ?? '');
    setErrors({});
    setModalVisible(true);
  };

  const validate = () => {
    const next: FieldErrors<LocationFields> = {
      name: validateRequiredText(name, 'Warehouse name', { min: 2 }) ?? undefined,
      address: validateOptionalText(address, 'Address', { max: 120 }) ?? undefined,
    };
    setErrors(next);
    return !hasErrors(next);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      const payload = { name: name.trim(), address: address.trim() };
      if (editing) {
        await apiClient.put(`/warehouse-locations/${editing.id}`, payload);
      } else {
        await apiClient.post('/warehouse-locations', payload);
      }
      setModalVisible(false);
      fetchLocations();
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not save location.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPrimary = async (location: WarehouseLocation) => {
    if (location.isPrimary) return;
    setLocations((prev) => prev.map((l) => ({ ...l, isPrimary: l.id === location.id })));
    try {
      await apiClient.patch(`/warehouse-locations/${location.id}/primary`);
    } catch {
      fetchLocations();
    }
  };

  const handleRemove = (location: WarehouseLocation) => {
    showAlert('Remove Location', `Remove ${location.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiClient.delete(`/warehouse-locations/${location.id}`);
            fetchLocations();
          } catch (error: any) {
            showAlert('Error', error.response?.data?.message || 'Could not remove location.');
          }
        },
      },
    ]);
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Warehouses" />

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 pt-6 pb-12"
          showsVerticalScrollIndicator={false}>
          <Text className="mb-6 text-sm font-sans-medium" style={theme.textMuted}>
            Manage the locations where buyers can pick up scrap materials.
          </Text>

          {locations.length === 0 ? (
            <View className="items-center py-12">
              <View
                className="mb-4 h-16 w-16 items-center justify-center rounded-full"
                style={theme.accentSoft}>
                <Feather name="map-pin" size={28} color={colors.accent} />
              </View>
              <Text className="mb-1 text-base font-sans-bold" style={theme.textPrimary}>
                No locations yet
              </Text>
              <Text className="text-center text-sm font-sans-medium" style={theme.textMuted}>
                Add a warehouse so buyers know where to collect.
              </Text>
            </View>
          ) : (
            locations.map((location) => (
              <View
                key={location.id}
                className="relative mb-4 overflow-hidden rounded-2xl border p-5 shadow-sm"
                style={theme.card}>
                {location.isPrimary && (
                  <View
                    className="absolute right-0 top-0 rounded-bl-xl border-b border-l px-3 py-1"
                    style={theme.accentSoft}>
                    <Text className="text-xs font-sans-bold" style={theme.textAccent}>
                      PRIMARY HQ
                    </Text>
                  </View>
                )}

                <View className="mb-4 flex-row items-start pt-1">
                  <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full border"
                    style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                    <Feather name="map" size={18} color={colors.primary} />
                  </View>
                  <View className="flex-1 pr-16">
                    <Text className="text-lg font-sans-bold" style={theme.textPrimary}>
                      {location.name}
                    </Text>
                    {location.address ? (
                      <Text className="mt-1 text-base font-sans-medium leading-5" style={theme.textMuted}>
                        {location.address}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View
                  className="flex-row items-center justify-between border-t pt-4"
                  style={{ borderTopColor: colors.border }}>
                  {!location.isPrimary ? (
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleSetPrimary(location)}>
                      <Feather name="star" size={16} color={colors.accent} />
                      <Text className="ml-2 text-sm font-sans-bold" style={theme.textAccent}>
                        Set primary
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="mr-5 flex-row items-center"
                      onPress={() => openEdit(location)}>
                      <Feather name="edit-2" size={16} color={colors.accent} />
                      <Text className="ml-2 text-sm font-sans-bold" style={theme.textAccent}>
                        Edit
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleRemove(location)}>
                      <Feather name="trash-2" size={16} color={colors.destructive} />
                      <Text
                        className="ml-2 text-sm font-sans-bold"
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
            className="mt-2 w-full flex-row items-center justify-center rounded-2xl border-2 border-dashed py-6 shadow-sm"
            style={{ ...theme.card, borderColor: colors.border }}>
            <Feather name="plus-circle" size={24} color={colors.accent} />
            <Text className="ml-2 text-base font-sans-bold" style={theme.textAccent}>
              Add New Location
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
              <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
            </View>
            <Text className="mb-6 text-xl font-sans-bold" style={theme.textPrimary}>
              {editing ? 'Edit Location' : 'Add Location'}
            </Text>

            <View className="mb-6 gap-4">
              <TextField
                label="Warehouse Name"
                leftIcon="home"
                value={name}
                error={errors.name}
                placeholder="e.g. Tema Main Yard"
                onChangeText={(v) => {
                  setName(v);
                  setErrors((e) => ({ ...e, name: undefined }));
                }}
              />
              <TextField
                label="Address"
                leftIcon="map-pin"
                value={address}
                error={errors.address}
                multiline
                placeholder="Heavy Industrial Area, Plot 42, Tema"
                onChangeText={(v) => {
                  setAddress(v);
                  setErrors((e) => ({ ...e, address: undefined }));
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
