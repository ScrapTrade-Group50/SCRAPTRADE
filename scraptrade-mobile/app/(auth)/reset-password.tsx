import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient, readTokenFromWebUrl, warmBackend } from '../../api/client';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import ScreenHeader from '@/components/ScreenHeader';
import { Button, TextField, FormErrorBanner } from '@/components/ui';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { parseResetPasswordError } from '@/utils/apiErrors';
import {
  validatePassword,
  validatePasswordMatch,
  required,
  type FieldErrors,
} from '@/utils/validation';

type ResetView = 'form' | 'success';
type ResetFields = 'token' | 'password' | 'confirmPassword';

function resolveInitialToken(tokenParam: string | string[] | undefined): string {
  const fromRoute = Array.isArray(tokenParam) ? tokenParam[0] : (tokenParam ?? '');
  if (fromRoute?.trim()) {
    return fromRoute.trim();
  }
  return readTokenFromWebUrl();
}

export default function ResetPassword() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const { token: tokenParam } = useLocalSearchParams();
  const submittedRef = useRef(false);
  const clearedSessionRef = useRef(false);

  const initialToken = resolveInitialToken(tokenParam);
  const hasLinkToken = Boolean(initialToken);

  const [view, setView] = useState<ResetView>('form');
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showManualToken, setShowManualToken] = useState(!hasLinkToken);
  const [errors, setErrors] = useState<FieldErrors<ResetFields>>({});
  const [formError, setFormError] = useState('');
  const [tokenExpired, setTokenExpired] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    warmBackend().catch(() => undefined);
  }, []);

  useEffect(() => {
    const fromWeb = readTokenFromWebUrl();
    if (fromWeb && fromWeb !== token) {
      setToken(fromWeb);
      setShowManualToken(false);
    }
  }, [token]);

  useEffect(() => {
    if (clearedSessionRef.current) return;
    clearedSessionRef.current = true;
    AsyncStorage.removeItem('userToken');
  }, []);

  const clearField = (field: ResetFields) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError('');
    setTokenExpired(false);
  };

  const validate = () => {
    const next: FieldErrors<ResetFields> = {
      token: required(token, 'Reset token') ?? undefined,
      password: validatePassword(password, { min: 6 }) ?? undefined,
      confirmPassword:
        validatePassword(confirmPassword, { min: 6 }) ??
        validatePasswordMatch(password, confirmPassword) ??
        undefined,
    };
    if (!next.confirmPassword) {
      next.confirmPassword = validatePasswordMatch(password, confirmPassword) ?? undefined;
    }
    setErrors(next);
    return !next.token && !next.password && !next.confirmPassword;
  };

  const handleReset = async () => {
    if (submittedRef.current || isLoading || view === 'success') return;
    if (!validate()) return;

    submittedRef.current = true;
    setIsLoading(true);
    setFormError('');
    setTokenExpired(false);

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: password,
      });
      setSuccessMessage(
        response.data.message || 'Password updated successfully. You can now sign in.'
      );
      setView('success');
    } catch (error: unknown) {
      submittedRef.current = false;
      const parsed = parseResetPasswordError(error);
      setFormError(parsed.formError);
      setTokenExpired(Boolean(parsed.tokenExpired));
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'success') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="mb-6 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.success }}>
            <Feather name="check" size={40} color={colors.onAccent} />
          </View>
          <Text className="mb-3 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Password Updated
          </Text>
          <Text className="mb-8 text-center text-base font-sans-medium leading-6" style={theme.textMuted}>
            {successMessage}
          </Text>
          <View
            className="w-full flex-row gap-3 rounded-2xl border px-4 py-4"
            style={{ ...theme.successSoft, borderColor: `${colors.success}40` }}>
            <Feather name="shield" size={20} color={colors.success} />
            <Text className="flex-1 text-sm font-sans-medium leading-5" style={theme.textPrimary}>
              Your reset link has been used. Sign in with your new password.
            </Text>
          </View>
        </View>
        <View className="px-6 pb-8">
          <Button label="Sign In" onPress={() => router.replace('/(auth)/sign-in')} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="New Password" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled">
          <Text className="mb-4 text-base font-sans-medium" style={theme.textMuted}>
            {hasLinkToken || token
              ? 'Choose a new password for your account. Reset links expire after 1 hour.'
              : 'Enter the reset token from your email and choose a new password.'}
          </Text>

          <FormErrorBanner message={formError} />

          {tokenExpired ? (
            <View
              className="mb-4 rounded-xl border px-4 py-3"
              style={{ ...theme.accentSoft, borderColor: `${colors.accent}40` }}>
              <Text className="text-sm font-sans-medium leading-5" style={theme.textPrimary}>
                This link is invalid or has expired.{' '}
                <Link href="/(auth)/forgot-password" asChild>
                  <Text className="font-sans-bold" style={theme.textAccent}>
                    Request a new reset link
                  </Text>
                </Link>
              </Text>
            </View>
          ) : null}

          <View
            className="mb-8 gap-5 rounded-3xl border p-5"
            style={{ ...theme.card, borderColor: colors.border }}>
            {showManualToken ? (
              <TextField
                label="Reset Token"
                leftIcon="key"
                value={token}
                error={errors.token}
                editable={!isLoading}
                autoCapitalize="none"
                onChangeText={(v) => {
                  setToken(v);
                  clearField('token');
                }}
              />
            ) : null}
            {!showManualToken && (hasLinkToken || token) ? (
              <TouchableOpacity onPress={() => setShowManualToken(true)} disabled={isLoading}>
                <Text className="text-sm font-sans-semibold" style={theme.textAccent}>
                  Enter token manually
                </Text>
              </TouchableOpacity>
            ) : null}
            <TextField
              label="New Password"
              isPassword
              value={password}
              error={errors.password}
              editable={!isLoading}
              hint="At least 6 characters"
              onChangeText={(v) => {
                setPassword(v);
                clearField('password');
              }}
            />
            <TextField
              label="Confirm Password"
              isPassword
              value={confirmPassword}
              error={errors.confirmPassword}
              editable={!isLoading}
              onChangeText={(v) => {
                setConfirmPassword(v);
                clearField('confirmPassword');
              }}
            />
          </View>

          <Button label="Update Password" loading={isLoading} onPress={handleReset} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
