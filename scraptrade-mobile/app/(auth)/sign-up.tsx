import React, { useState } from 'react';
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
import {
  validateEmail,
  validatePassword,
  validateRequiredText,
  type FieldErrors,
} from '@/utils/validation';
import { parseRegisterError } from '@/utils/apiErrors';

type SignUpFields = 'companyName' | 'email' | 'password';

export default function SignUp() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const login = useAuthStore((state) => state.login);

  const [role, setRole] = useState<'artisan' | 'factory'>('artisan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors<SignUpFields>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const clearFieldError = (field: SignUpFields) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setFormError(null);
  };

  const validate = () => {
    const next: FieldErrors<SignUpFields> = {
      email: validateEmail(email) ?? undefined,
      password: validatePassword(password, { min: 6 }) ?? undefined,
      companyName: companyName.trim()
        ? validateRequiredText(companyName, 'Business name', { min: 2 }) ?? undefined
        : undefined,
    };
    setErrors(next);
    return !next.email && !next.password && !next.companyName;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setIsLoading(true);
    setFormError(null);
    try {
      const backendRole = role === 'factory' ? 'FACTORY_SELLER' : 'ARTISAN_BUYER';
      const response = await apiClient.post('/auth/register', {
        email: email.trim(),
        password,
        role: backendRole,
        companyName: companyName.trim() || email.trim(),
      });

      await AsyncStorage.setItem('userToken', response.data.token);
      const mappedRole = mapBackendRole(response.data.role);
      await login(mappedRole, response.data.userId, response.data.companyName);

      if (mappedRole === 'factory') {
        router.replace(ROUTES.factoryDashboard);
      } else {
        router.replace(ROUTES.artisanFeed);
      }
    } catch (error: unknown) {
      const { formError, emailError } = parseRegisterError(error);
      setFormError(formError);
      if (emailError) {
        setErrors((prev) => ({ ...prev, email: emailError }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const roleCardStyle = (selected: boolean) =>
    selected
      ? { borderColor: colors.accent, backgroundColor: `${colors.accent}18`, borderWidth: 2 }
      : { borderColor: colors.border, backgroundColor: colors.card, borderWidth: 2 };

  return (
    <ThemedSafeAreaView edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
            paddingBottom: 40,
          }}
          bounces={false}
          overScrollMode="never"
          keyboardShouldPersistTaps="handled">
          <View className="mb-8 mt-2 items-center">
            <View
              className="mb-5 h-16 w-16 items-center justify-center rounded-2xl"
              style={theme.accentFill}>
              <Text className="text-3xl font-sans-bold" style={theme.textOnAccent}>
                ST
              </Text>
            </View>
            <Text className="text-3xl font-sans-bold" style={theme.textPrimary}>
              Create account
            </Text>
            <Text className="mt-2 text-center text-base font-sans-medium" style={theme.textMuted}>
              Join the circular economy marketplace
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-3 text-sm font-sans-semibold" style={theme.textPrimary}>
              I am registering as
            </Text>
            <View className="flex-row gap-3">
              {(['artisan', 'factory'] as const).map((option) => {
                const selected = role === option;
                return (
                  <TouchableOpacity
                    key={option}
                    onPress={() => setRole(option)}
                    className="flex-1 items-center justify-center rounded-2xl p-4"
                    style={roleCardStyle(selected)}>
                    <Text
                      className="text-lg font-sans-bold"
                      style={selected ? theme.textAccent : theme.textPrimary}>
                      {option === 'artisan' ? 'Artisan' : 'Factory'}
                    </Text>
                    <Text className="mt-1 text-center text-xs font-sans-medium" style={theme.textMuted}>
                      {option === 'artisan' ? 'Buy scrap materials' : 'Sell off-cuts'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FormErrorBanner message={formError} />

          <View
            className="mb-8 gap-5 rounded-3xl border p-5"
            style={{ ...theme.card, borderColor: colors.border }}>
            <TextField
              label="Company / Business Name"
              leftIcon="briefcase"
              placeholder="Your business name"
              value={companyName}
              error={errors.companyName}
              hint="Optional — we will use your email if left blank"
              onChangeText={(v) => {
                setCompanyName(v);
                clearFieldError('companyName');
              }}
            />
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
              placeholder="At least 6 characters"
              autoComplete="new-password"
              textContentType="newPassword"
              value={password}
              error={errors.password}
              onChangeText={(v) => {
                setPassword(v);
                clearFieldError('password');
              }}
            />
          </View>

          <View className="mt-auto">
            <Button label="Create Account" loading={isLoading} onPress={handleRegister} />

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm font-sans-medium" style={theme.textMuted}>
                Already have an account?{' '}
              </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-sans-bold" style={theme.textAccent}>
                    Sign In
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
