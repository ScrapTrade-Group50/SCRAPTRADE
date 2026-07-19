import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiClient } from '../../api/client';

type ResetView = 'form' | 'success';

export default function ResetPassword() {
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams();
  const submittedRef = useRef(false);

  const initialToken = Array.isArray(tokenParam) ? tokenParam[0] : (tokenParam ?? '');
  const hasLinkToken = Boolean(initialToken?.trim());

  const [view, setView] = useState<ResetView>('form');
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showManualToken, setShowManualToken] = useState(!hasLinkToken);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleReset = async () => {
    if (submittedRef.current || isLoading || view === 'success') return;

    setFormError('');

    if (!token.trim() || !password || !confirmPassword) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    submittedRef.current = true;
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: password,
      });
      setSuccessMessage(
        response.data.message || 'Password updated successfully. You can now sign in.'
      );
      setView('success');
    } catch (error: any) {
      submittedRef.current = false;
      setFormError(error.response?.data?.message || 'Could not reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'success') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 rounded-full bg-emerald-500 items-center justify-center mb-6">
            <Feather name="check" size={40} color="#ffffff" />
          </View>
          <Text className="text-2xl font-sans-extrabold text-primary text-center mb-3">
            Password Updated
          </Text>
          <Text className="text-base font-sans-medium text-muted-foreground text-center leading-6 mb-8">
            {successMessage}
          </Text>
          <View className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 flex-row gap-3">
            <Feather name="shield" size={20} color="#059669" />
            <Text className="flex-1 text-sm font-sans-medium text-emerald-900 leading-5">
              Your reset link has been used. Sign in with your new password.
            </Text>
          </View>
        </View>
        <View className="px-6 pb-8">
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/sign-in')}
            className="w-full items-center rounded-xl py-4 bg-accent">
            <Text className="text-base font-sans-bold text-white">Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="px-6 py-4 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 pt-6 pb-12"
          keyboardShouldPersistTaps="handled">
          <Text className="text-3xl font-sans-extrabold text-primary mb-2">New Password</Text>
          <Text className="text-base font-sans-medium text-muted-foreground mb-6">
            {hasLinkToken
              ? 'Choose a new password for your account. This link expires in 1 hour.'
              : 'Enter the reset token from your email and choose a new password.'}
          </Text>

          {formError ? (
            <View className="mb-6 flex-row items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <Text className="flex-1 text-sm font-sans-medium text-red-800 leading-5">{formError}</Text>
            </View>
          ) : null}

          <View className="gap-5 mb-8">
            {showManualToken ? (
              <View className="gap-2">
                <Text className="text-sm font-sans-semibold text-primary">Reset Token</Text>
                <TextInput
                  className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            ) : null}
            {!showManualToken && hasLinkToken ? (
              <TouchableOpacity onPress={() => setShowManualToken(true)} disabled={isLoading}>
                <Text className="text-sm font-sans-semibold text-accent">Enter token manually</Text>
              </TouchableOpacity>
            ) : null}
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">New Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Confirm Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleReset}
            disabled={isLoading}
            className={`w-full items-center rounded-xl py-4 ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-sans-bold text-white">Update Password</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
