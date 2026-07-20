import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient, buildForgotPasswordPayload, warmBackend } from '../../api/client';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import ScreenHeader from '@/components/ScreenHeader';
import { Button, TextField, FormErrorBanner } from '@/components/ui';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { validateEmail } from '@/utils/validation';
import { parseForgotPasswordError } from '@/utils/apiErrors';

type ForgotView = 'form' | 'email_sent' | 'dev_token' | 'reset_link';

export default function ForgotPassword() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const submittedRef = useRef(false);

  const [view, setView] = useState<ForgotView>('form');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isWarming, setIsWarming] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [devToken, setDevToken] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    warmBackend().finally(() => setIsWarming(false));
  }, []);

  const handleReset = async () => {
    if (submittedRef.current || isLoading || view !== 'form') return;

    const err = validateEmail(email);
    if (err) {
      setEmailError(err);
      return;
    }

    setEmailError(null);
    setFormError('');
    submittedRef.current = true;
    setIsLoading(true);

    try {
      await warmBackend();
      const response = await apiClient.post(
        '/auth/forgot-password',
        buildForgotPasswordPayload(email)
      );
      const token = response.data.resetToken as string | undefined;
      const link = response.data.resetLink as string | undefined;
      const message = response.data.message as string | undefined;

      if (link) {
        setResetLink(link);
        setSuccessMessage(message || 'Use the reset link below to set your password.');
        setView('reset_link');
      } else if (token) {
        setDevToken(token);
        setView('dev_token');
      } else {
        setView('email_sent');
      }
    } catch (error: unknown) {
      submittedRef.current = false;
      setFormError(parseForgotPasswordError(error));
    } finally {
      setIsLoading(false);
    }
  };

  const openResetLink = () => {
    if (!resetLink) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = resetLink;
      return;
    }
    Linking.openURL(resetLink).catch(() => {
      setFormError('Could not open the reset link on this device.');
      setView('form');
    });
  };

  if (view === 'email_sent') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center justify-center px-6">
          <View
            className="mb-6 h-20 w-20 items-center justify-center rounded-full"
            style={theme.accentSoft}>
            <Feather name="mail" size={36} color={colors.accent} />
          </View>
          <Text className="mb-3 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Check Your Email
          </Text>
          <Text className="mb-4 text-center text-base font-sans-medium leading-6" style={theme.textMuted}>
            If an account exists for{' '}
            <Text className="font-sans-bold" style={theme.textPrimary}>
              {email.trim()}
            </Text>
            , we sent a password reset link.
          </Text>
          <Text className="text-center text-sm font-sans-medium leading-5" style={theme.textMuted}>
            Open the link in your browser. It expires in 1 hour. Check spam if you do not see it.
          </Text>
        </View>
        <View className="gap-3 px-6 pb-8">
          <Button label="Back to Sign In" onPress={() => router.back()} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'reset_link') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-12">
          <View
            className="mb-6 h-20 w-20 items-center justify-center self-center rounded-full"
            style={theme.accentSoft}>
            <Feather name="link" size={32} color={colors.accent} />
          </View>
          <Text className="mb-3 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Reset Link Ready
          </Text>
          <Text className="mb-6 text-center text-base font-sans-medium leading-6" style={theme.textMuted}>
            {successMessage}
          </Text>
          <View
            className="mb-6 rounded-xl border px-4 py-4"
            style={{ ...theme.card, borderColor: colors.border }}>
            <Text
              className="text-center text-xs font-sans-medium leading-5"
              style={theme.textMuted}
              selectable>
              {resetLink}
            </Text>
          </View>
        </View>
        <View className="gap-3 px-6 pb-8">
          <Button label="Open Reset Page" onPress={openResetLink} />
          <Button
            label="Back to Sign In"
            variant="secondary"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'dev_token') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 px-6 pt-12">
          <View
            className="mb-6 h-20 w-20 items-center justify-center self-center rounded-full"
            style={theme.cardMuted}>
            <Feather name="code" size={32} color={colors.mutedForeground} />
          </View>
          <Text className="mb-3 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Reset Token
          </Text>
          <Text className="mb-6 text-center text-base font-sans-medium leading-6" style={theme.textMuted}>
            Use this token on the reset screen. It expires in 1 hour.
          </Text>
          <View
            className="mb-6 rounded-xl border px-4 py-4"
            style={{ ...theme.card, borderColor: colors.border }}>
            <Text
              className="text-center text-sm font-sans-bold"
              style={theme.textPrimary}
              selectable
              accessibilityLabel="Reset token">
              {devToken}
            </Text>
          </View>
        </View>
        <View className="gap-3 px-6 pb-8">
          <Button
            label="Continue to Reset"
            onPress={() =>
              router.push(`/(auth)/reset-password?token=${encodeURIComponent(devToken)}`)
            }
          />
          <TouchableOpacity onPress={() => router.back()} className="w-full items-center py-3">
            <Text className="text-base font-sans-semibold" style={theme.textMuted}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Reset Password" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 items-center">
            <View
              className="mb-6 h-20 w-20 items-center justify-center rounded-full"
              style={theme.accentSoft}>
              <Feather name="lock" size={32} color={colors.accent} />
            </View>
            <Text className="mb-2 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
              Forgot your password?
            </Text>
            <Text className="px-2 text-center text-base font-sans-medium" style={theme.textMuted}>
              Enter your account email. We will send a link to reset your password.
            </Text>
            {isWarming ? (
              <Text className="mt-3 text-center text-xs font-sans-medium" style={theme.textMuted}>
                Connecting to server… first request may take up to a minute.
              </Text>
            ) : null}
          </View>

          <FormErrorBanner message={formError} />

          <TextField
            label="Email Address"
            leftIcon="mail"
            placeholder="e.g. you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            error={emailError}
            editable={!isLoading}
            containerClassName="mb-8"
            onChangeText={(v) => {
              setEmail(v);
              setEmailError(null);
              setFormError('');
            }}
          />

          <Button
            label="Send Reset Link"
            loading={isLoading}
            loadingLabel={isWarming ? 'Connecting…' : 'Sending…'}
            onPress={handleReset}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
