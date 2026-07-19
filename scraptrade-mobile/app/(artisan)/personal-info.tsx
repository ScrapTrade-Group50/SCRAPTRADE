import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '@/store/authStore';

export default function PersonalInformation() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setCompanyName(response.data.companyName ?? '');
        setEmail(response.data.email ?? '');
        setPhoneNumber(response.data.phoneNumber ?? '');
      } catch {
        Alert.alert('Error', 'Could not load profile.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const handleSave = async () => {
    if (!companyName.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    setIsSaving(true);
    try {
      await updateProfile(companyName.trim(), phoneNumber.trim());
      Alert.alert('Saved', 'Your profile has been updated.');
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Could not save profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const initials = companyName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row justify-between items-center px-6 py-4 bg-background border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0b1f1a" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-primary">Personal Info</Text>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <Text className="text-base font-sans-bold text-accent">Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <View className="items-center mb-8 pt-4">
          <View className="h-24 w-24 bg-accent/10 rounded-full items-center justify-center border-4 border-card shadow-sm">
            <Text className="text-3xl font-sans-bold text-accent">{initials || '?'}</Text>
          </View>
        </View>

        <View className="gap-5 mb-10">
          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Full Name</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              value={companyName}
              onChangeText={setCompanyName}
              placeholderTextColor="#9ca3af"
            />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Email Address</Text>
            <TextInput
              className="rounded-xl border border-border bg-muted px-4 py-4 text-base font-sans-medium text-muted-foreground"
              value={email}
              editable={false}
            />
          </View>
          <View className="gap-2">
            <Text className="text-sm font-sans-semibold text-primary ml-1">Phone Number</Text>
            <TextInput
              className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
