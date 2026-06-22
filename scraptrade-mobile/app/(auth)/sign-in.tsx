import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '@/api/client';

export default function SignIn() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  // 1. We hold the email and password here.
  // Pre-filled with your test factory credentials to save you time while developing!
  const [email, setEmail] = useState('artisan@test.com');
  const [password, setPassword] = useState('hashed_password_456');
  const [isLoading, setIsLoading] = useState(false);

  // 2. The Engine: Talks to Spring Boot
  const handleLogin = async () => {
    console.log('🚀 Sign In Button Clicked!'); // <-- ADD THIS LINE
    console.log('Attempting to login with:', email, password); // <-- ADD THIS TOO

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      // Send credentials to your backend
      const response = await apiClient.post('/auth/login', {
        email: email,
        password: password,
      });

      // Grab the VIP wristband from the response
      const token = response.data.token;

      // Securely store the token on the phone
      await AsyncStorage.setItem('userToken', token);

      // Determine role based on email (since our backend doesn't return role yet)
      const role = email.includes('factory') ? 'factory' : 'artisan';

      // Update your global Zustand store!
      login(role);

      // Navigate to the correct dashboard based on who logged in
      if (role === 'factory') {
        router.replace('/(factory)/dashboard');
      } else {
        router.replace('/(artisan)/feed');
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      Alert.alert(
        'Login Failed',
        error.response?.data?.message ||
          'Could not connect to the server. Is Spring Boot running and IP address correct?'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="bg-background flex-1" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName="grow justify-center px-6 pb-10 pt-12"
          bounces={false}
          overScrollMode="never">
          {/* Header */}
          <View className="mb-12 items-center">
            <View className="bg-accent mb-6 h-16 w-16 items-center justify-center rounded-2xl">
              <Text className="font-sans-bold text-3xl text-white">ST</Text>
            </View>
            <Text className="font-sans-bold text-primary text-3xl">Welcome Back</Text>
            <Text className="font-sans-medium text-muted-foreground mt-2 text-center text-base">
              Login to access the SCRAPTRADE marketplace
            </Text>
          </View>

          {/* Input Fields */}
          <View className="mb-6 gap-5">
            <View className="gap-2">
              <Text className="font-sans-semibold text-primary text-sm">Email Address</Text>
              <TextInput
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-4 text-base"
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                // WIRED UP TO STATE HERE:
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View className="mt-4 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-sans-semibold text-primary text-sm">Password</Text>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="font-sans-semibold text-accent text-sm">Forgot?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <TextInput
                className="border-border bg-card font-sans-medium text-primary rounded-xl border px-4 py-4 text-base"
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                secureTextEntry
                // WIRED UP TO STATE HERE:
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="mt-8 gap-4">
            {/* The Real Sign In Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              className={`w-full flex-row items-center justify-center rounded-xl py-4 shadow-sm ${isLoading ? 'bg-primary/70' : 'bg-primary'}`}>
              {isLoading ? <ActivityIndicator color="#ffffff" className="mr-2" /> : null}
              <Text className="font-sans-bold text-base text-white">
                {isLoading ? 'Authenticating...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="font-sans-medium text-muted-foreground text-sm">
                Do not have an account?{' '}
              </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="font-sans-bold text-accent text-sm">Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
