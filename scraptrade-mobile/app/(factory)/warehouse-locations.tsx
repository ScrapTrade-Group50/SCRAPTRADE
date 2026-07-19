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

type WarehouseLocation = {
  id: number;
  name: string;
  address: string | null;
  isPrimary: boolean;
};

export default function WarehouseLocations() {
  const router = useRouter();
  const [locations, setLocations] = useState<WarehouseLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<WarehouseLocation | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

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
    setModalVisible(true);
  };

  const openEdit = (location: WarehouseLocation) => {
    setEditing(location);
    setName(location.name ?? '');
    setAddress(location.address ?? '');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Required', 'Please enter a warehouse name.');
      return;
    }
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
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Warehouses</Text>
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
            Manage the locations where buyers can pick up scrap materials.
          </Text>

          {locations.length === 0 ? (
            <View className="items-center py-12">
              <View className="h-16 w-16 bg-accent/10 rounded-full items-center justify-center mb-4">
                <Feather name="map-pin" size={28} color="#6366f1" />
              </View>
              <Text className="text-base font-sans-bold text-primary mb-1">No locations yet</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground text-center">
                Add a warehouse so buyers know where to collect.
              </Text>
            </View>
          ) : (
            locations.map((location) => (
              <View
                key={location.id}
                className="bg-card border border-border rounded-2xl p-5 mb-4 shadow-sm relative overflow-hidden">
                {location.isPrimary && (
                  <View className="absolute top-0 right-0 bg-accent/10 px-3 py-1 rounded-bl-xl border-b border-l border-accent/20">
                    <Text className="text-xs font-sans-bold text-accent">PRIMARY HQ</Text>
                  </View>
                )}

                <View className="flex-row items-start mb-4 pt-1">
                  <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-3 border border-border">
                    <Feather name="map" size={18} color="#0b1f1a" />
                  </View>
                  <View className="flex-1 pr-16">
                    <Text className="text-lg font-sans-bold text-primary">{location.name}</Text>
                    {location.address ? (
                      <Text className="text-base font-sans-medium text-muted-foreground mt-1 leading-5">
                        {location.address}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View className="flex-row items-center justify-between pt-4 border-t border-border">
                  {!location.isPrimary ? (
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleSetPrimary(location)}>
                      <Feather name="star" size={16} color="#6366f1" />
                      <Text className="text-sm font-sans-bold text-accent ml-2">Set primary</Text>
                    </TouchableOpacity>
                  ) : (
                    <View />
                  )}

                  <View className="flex-row items-center">
                    <TouchableOpacity
                      className="flex-row items-center mr-5"
                      onPress={() => openEdit(location)}>
                      <Feather name="edit-2" size={16} color="#6366f1" />
                      <Text className="text-sm font-sans-bold text-accent ml-2">Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="flex-row items-center"
                      onPress={() => handleRemove(location)}>
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
            className="w-full flex-row items-center justify-center rounded-2xl bg-card border-2 border-dashed border-border py-6 mt-2 shadow-sm">
            <Feather name="plus-circle" size={24} color="#6366f1" />
            <Text className="text-base font-sans-bold text-accent ml-2">Add New Location</Text>
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
              {editing ? 'Edit Location' : 'Add Location'}
            </Text>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Warehouse Name</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={name}
                onChangeText={setName}
                placeholder="e.g. Tema Main Yard"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="gap-2 mb-6">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Address</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={address}
                onChangeText={setAddress}
                multiline
                placeholder="Heavy Industrial Area, Plot 42, Tema"
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
