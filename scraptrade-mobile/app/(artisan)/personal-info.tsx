import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '@/store/authStore';
import ScreenHeader from '@/components/ScreenHeader';
import { TextField, FormErrorBanner } from '@/components/ui';
import { useThemeStore } from '@/store/themeStore';
import {
  validatePhone,
  validateRequiredText,
  type FieldErrors,
} from '@/utils/validation';
import { showErrorNotice, showSuccessNotice } from '@/utils/alert';

type ProfileFields = 'companyName' | 'phoneNumber';

export default function PersonalInformation() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const colors = useThemeStore((s) => s.colors);

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<ProfileFields>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setCompanyName(response.data.companyName ?? '');
        setEmail(response.data.email ?? '');
        setPhoneNumber(response.data.phoneNumber ?? '');
      } catch {
        showErrorNotice('Error', 'Could not load profile.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const validate = () => {
    const next: FieldErrors<ProfileFields> = {
      companyName: validateRequiredText(companyName, 'Full name', { min: 2 }) ?? undefined,
      phoneNumber: validatePhone(phoneNumber, { required: false }) ?? undefined,
    };
    setErrors(next);
    return !next.companyName && !next.phoneNumber;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await updateProfile(companyName.trim(), phoneNumber.trim().replace(/\s+/g, ''));
      showSuccessNotice('Saved', 'Your profile has been updated.', () => router.back());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Could not save profile.';
      setFormError(message);
      showErrorNotice('Error', message);
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
      <ThemedSafeAreaView className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.accent} />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader
        title="Personal Info"
        right={
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text className="text-base font-sans-bold text-accent">Save</Text>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-8 items-center pt-4">
          <View className="h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-accent/10">
            <Text className="text-3xl font-sans-bold text-accent">{initials || '?'}</Text>
          </View>
        </View>

        <FormErrorBanner message={formError} />

        <View className="mb-10 gap-5">
          <TextField
            label="Full Name"
            leftIcon="user"
            value={companyName}
            error={errors.companyName}
            onChangeText={(v) => {
              setCompanyName(v);
              setErrors((e) => ({ ...e, companyName: undefined }));
            }}
          />
          <TextField
            label="Email Address"
            leftIcon="mail"
            value={email}
            editable={false}
            hint="Email cannot be changed here"
          />
          <TextField
            label="Phone Number"
            leftIcon="phone"
            value={phoneNumber}
            error={errors.phoneNumber}
            keyboardType="phone-pad"
            placeholder="0241234567"
            textContentType="telephoneNumber"
            onChangeText={(v) => {
              setPhoneNumber(v);
              setErrors((e) => ({ ...e, phoneNumber: undefined }));
            }}
          />
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
