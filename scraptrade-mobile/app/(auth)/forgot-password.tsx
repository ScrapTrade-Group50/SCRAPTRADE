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
import { useRouter } from 'expo-router';
import { apiClient } from '../../api/client';

type ForgotView = 'form' | 'email_sent' | 'dev_token';

export default function ForgotPassword() {
  const router = useRouter();
  const submittedRef = useRef(false);

  const [view, setView] = useState<ForgotView>('form');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [devToken, setDevToken] = useState('');

  const handleReset = async () => {
    if (submittedRef.current || isLoading || view !== 'form') return;

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }

    setFormError('');
    submittedRef.current = true;
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email: email.trim() });
      const resetToken = response.data.resetToken as string | undefined;

      if (resetToken) {
        setDevToken(resetToken);
        setView('dev_token');
      } else {
        setView('email_sent');
      }
    } catch (error: any) {
      submittedRef.current = false;
      const message =
        error.response?.data?.message ||
        (error.code === 'ERR_NETWORK'
          ? 'Could not reach the server. Is the backend running?'
          : 'Could not request password reset.');
      setFormError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (view === 'email_sent') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="h-20 w-20 rounded-full bg-accent/10 items-center justify-center mb-6">
            <Feather name="mail" size={36} color="#6366f1" />
          </View>
          <Text className="text-2xl font-sans-extrabold text-primary text-center mb-3">
            Check Your Email
          </Text>
          <Text className="text-base font-sans-medium text-muted-foreground text-center leading-6 mb-4">
            If an account exists for{' '}
            <Text className="font-sans-bold text-primary">{email.trim()}</Text>, we sent a password
            reset link.
          </Text>
          <Text className="text-sm font-sans-medium text-muted-foreground text-center leading-5">
            Open the link in your browser. It expires in 1 hour. Check spam if you do not see it.
          </Text>
        </View>
        <View className="px-6 pb-8 gap-3">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-full items-center rounded-xl py-4 bg-accent">
            <Text className="text-base font-sans-bold text-white">Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'dev_token') {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-12">
          <View className="h-20 w-20 rounded-full bg-amber-100 items-center justify-center mb-6 self-center">
            <Feather name="code" size={32} color="#b45309" />
          </View>
          <Text className="text-2xl font-sans-extrabold text-primary text-center mb-3">
            Dev Reset Token
          </Text>
          <Text className="text-base font-sans-medium text-muted-foreground text-center mb-6 leading-6">
            Mail is off in dev mode. Copy this token or continue to the reset screen.
          </Text>
          <View className="rounded-xl border border-border bg-card px-4 py-4 mb-6">
            <Text
              className="text-sm font-sans-bold text-primary text-center"
              selectable
              accessibilityLabel="Reset token">
              {devToken}
            </Text>
          </View>
        </View>
        <View className="px-6 pb-8 gap-3">
          <TouchableOpacity
            onPress={() =>
              router.push(`/(auth)/reset-password?token=${encodeURIComponent(devToken)}`)
            }
            className="w-full items-center rounded-xl py-4 bg-accent">
            <Text className="text-base font-sans-bold text-white">Continue to Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="w-full items-center py-3">
            <Text className="text-base font-sans-semibold text-muted-foreground">Cancel</Text>
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="items-center mb-8">
            <View className="h-20 w-20 bg-accent/10 rounded-full items-center justify-center mb-6">
              <Feather name="lock" size={32} color="#6366f1" />
            </View>
            <Text className="text-3xl font-sans-extrabold text-primary text-center mb-2">
              Reset Password
            </Text>
            <Text className="text-base font-sans-medium text-muted-foreground text-center px-4">
              Enter your account email. We will send a link to reset your password in your browser.
            </Text>
          </View>

          {formError ? (
            <View className="mb-6 flex-row items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <Feather name="alert-circle" size={20} color="#dc2626" />
              <Text className="flex-1 text-sm font-sans-medium text-red-800 leading-5">{formError}</Text>
            </View>
          ) : null}

          <View className="gap-2 mb-8">
            <Text className="text-sm font-sans-semibold text-primary">Email Address</Text>
            <View className="flex-row items-center border border-border bg-card rounded-xl px-4 h-14">
              <Feather name="mail" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-base font-sans-medium text-primary h-full"
                placeholder="e.g. you@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleReset}
            disabled={isLoading}
            className={`w-full items-center rounded-xl py-4 shadow-sm ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}>
            {isLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-sans-bold text-white">Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
