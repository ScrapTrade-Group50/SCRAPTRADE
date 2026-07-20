import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { useAuthStore } from '../../store/authStore';
import { apiClient, mapBackendRole } from '@/api/client';
import { ROUTES } from '@/utils/routes';
import { Button, TextField, FormErrorBanner } from '@/components/ui';
import { validateEmail, validatePassword, type FieldErrors } from '@/utils/validation';
import { parseLoginError } from '@/utils/apiErrors';

type SignInFields = 'email' | 'password';

export default function SignIn() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const login = useAuthStore((state) => state.login);
  const { isHydrated, hydrate } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SignInFields>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [showForgotHint, setShowForgotHint] = useState(false);

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const clearFieldError = (field: SignInFields) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
    setShowForgotHint(false);
  };

  const validate = () => {
    const next: FieldErrors<SignInFields> = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password) ?? undefined,
    };
    setErrors(next);
    return !next.email && !next.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);
    setShowForgotHint(false);
    try {
      const response = await apiClient.post('/auth/login', {
        email: email.trim(),
        password,
      });

      const token = response.data.token;
      await AsyncStorage.setItem('userToken', token);

      const role = mapBackendRole(response.data.role);
      await login(role, response.data.userId, response.data.companyName);

      if (role === 'factory') {
        router.replace(ROUTES.factoryDashboard);
      } else {
        router.replace(ROUTES.artisanFeed);
      }
    } catch (error: unknown) {
      console.error('Login Error:', error);
      const parsed = parseLoginError(error);
      setFormError(parsed.formError || null);
      setShowForgotHint(Boolean(parsed.suggestForgotPassword));
      if (parsed.passwordError) {
        setErrors((prev) => ({ ...prev, password: parsed.passwordError }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ThemedSafeAreaView edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingHorizontal: 24,
            paddingTop: 48,
            paddingBottom: 40,
          }}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled">
          <View className="mb-10 items-center">
            <View
              className="mb-6 h-16 w-16 items-center justify-center rounded-2xl"
              style={theme.accentFill}>
              <Text className="text-3xl font-sans-bold" style={theme.textOnAccent}>
                ST
              </Text>
            </View>
            <Text className="text-3xl font-sans-bold" style={theme.textPrimary}>
              Welcome back
            </Text>
            <Text className="mt-2 text-center text-base font-sans-medium" style={theme.textMuted}>
              Sign in to the SCRAPTRADE marketplace
            </Text>
          </View>

          <FormErrorBanner message={formError} />

          {showForgotHint ? (
            <View
              className="mb-4 rounded-xl border px-4 py-3"
              style={{ ...theme.accentSoft, borderColor: `${colors.accent}40` }}>
              <Text className="text-sm font-sans-medium leading-5" style={theme.textPrimary}>
                Need to set or reset your password?{' '}
                <Link href="/(auth)/forgot-password" asChild>
                  <Text className="font-sans-bold" style={theme.textAccent}>
                    Use Forgot password
                  </Text>
                </Link>
              </Text>
            </View>
          ) : null}

          <View
            className="mb-6 gap-5 rounded-3xl border p-5"
            style={{ ...theme.card, borderColor: colors.border }}>
            <TextField
              label="Email Address"
              leftIcon="mail"
              placeholder="name@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              value={email}
              error={errors.email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError('email');
              }}
            />

            <TextField
              label="Password"
              isPassword
              placeholder="Enter your password"
              autoComplete="password"
              textContentType="password"
              value={password}
              error={errors.password}
              onChangeText={(v) => {
                setPassword(v);
                clearFieldError('password');
              }}
              labelRight={
                <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-sm font-sans-semibold" style={theme.textAccent}>
                      Forgot?
                    </Text>
                  </TouchableOpacity>
                </Link>
              }
            />
          </View>

          <View className="mt-2 gap-4">
            <Button label="Sign In" loading={isLoading} onPress={handleLogin} />

            <View className="mt-4 flex-row items-center justify-center">
              <Text className="text-sm font-sans-medium" style={theme.textMuted}>
                Do not have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-sans-bold" style={theme.textAccent}>
                    Create Account
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}
