import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';
import { useAuthStore } from '@/store/authStore';
import ScreenHeader from '@/components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { TextField, FormErrorBanner } from '@/components/ui';
import {
  validatePhone,
  validateRequiredText,
  type FieldErrors,
} from '@/utils/validation';
import { showErrorNotice, showSuccessNotice } from '@/utils/alert';

type CompanyFields = 'companyName' | 'phoneNumber';

export default function CompanyDetails() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const theme = useScreenTheme();
  const { colors } = theme;

  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<CompanyFields>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await apiClient.get('/auth/me');
        setCompanyName(response.data.companyName ?? '');
        setEmail(response.data.email ?? '');
        setPhoneNumber(response.data.phoneNumber ?? '');
      } catch {
        showErrorNotice('Error', 'Could not load company details.');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [router]);

  const validate = () => {
    const next: FieldErrors<CompanyFields> = {
      companyName: validateRequiredText(companyName, 'Company name', { min: 2 }) ?? undefined,
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
      showSuccessNotice('Saved', 'Company details updated.', () => router.back());
    } catch (error: any) {
      const message = error.response?.data?.message || 'Could not save details.';
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
        title="Company Details"
        right={
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Text className="text-base font-sans-bold" style={theme.textAccent}>
                Save
              </Text>
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
          <View
            className="h-24 w-24 items-center justify-center rounded-2xl border-4"
            style={{ borderColor: colors.card, backgroundColor: `${colors.accent}1A` }}>
            <Text className="text-3xl font-sans-bold" style={theme.textAccent}>
              {initials || '?'}
            </Text>
          </View>
        </View>

        <FormErrorBanner message={formError} />

        <View className="mb-10 gap-5">
          <TextField
            label="Registered Company Name"
            leftIcon="briefcase"
            value={companyName}
            error={errors.companyName}
            onChangeText={(v) => {
              setCompanyName(v);
              setErrors((e) => ({ ...e, companyName: undefined }));
            }}
          />
          <TextField
            label="Business Email"
            leftIcon="mail"
            value={email}
            editable={false}
            hint="Email cannot be changed here"
          />
          <TextField
            label="Contact Phone"
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
