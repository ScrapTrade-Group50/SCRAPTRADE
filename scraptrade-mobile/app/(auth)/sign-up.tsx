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
import { apiClient, mapBackendRole } from '@/api/client';

export default function SignUp() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [role, setRole] = useState<'artisan' | 'factory'>('artisan');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in email and password.');
      return;
    }

    setIsLoading(true);
    try {
      const backendRole = role === 'factory' ? 'FACTORY_SELLER' : 'ARTISAN_BUYER';
      const response = await apiClient.post('/auth/register', {
        email,
        password,
        role: backendRole,
        companyName: companyName || email,
      });

      await AsyncStorage.setItem('userToken', response.data.token);
      const mappedRole = mapBackendRole(response.data.role);
      await login(mappedRole, response.data.userId, response.data.companyName);

      if (mappedRole === 'factory') {
        router.replace('/(factory)/dashboard');
      } else {
        router.replace('/(artisan)/feed');
      }
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Could not create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName="grow px-6 pb-10 pt-8"
          bounces={false}
          overScrollMode="never">

          <View className="mt-4 mb-10 items-center">
            <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Text className="text-3xl font-sans-bold text-white">ST</Text>
            </View>
            <Text className="text-3xl font-sans-bold text-primary">SCRAPTRADE</Text>
            <Text className="mt-2 text-center text-base font-sans-medium text-muted-foreground">
              The Circular Economy Marketplace
            </Text>
          </View>

          <View className="mb-8">
            <Text className="mb-3 text-sm font-sans-semibold text-primary">
              I am registering as a:
            </Text>
            <View className="flex-row gap-4">
              <TouchableOpacity
                onPress={() => setRole('artisan')}
                className={`flex-1 items-center justify-center rounded-2xl border-2 p-5 ${
                  role === 'artisan' ? 'border-accent bg-accent/10' : 'border-border bg-card'
                }`}>
                <Text className={`text-lg font-sans-bold ${role === 'artisan' ? 'text-accent' : 'text-primary'}`}>
                  Artisan
                </Text>
                <Text className="mt-1 text-center text-xs font-sans-medium text-muted-foreground">
                  I want to buy scrap
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRole('factory')}
                className={`flex-1 items-center justify-center rounded-2xl border-2 p-5 ${
                  role === 'factory' ? 'border-accent bg-accent/10' : 'border-border bg-card'
                }`}>
                <Text className={`text-lg font-sans-bold ${role === 'factory' ? 'text-accent' : 'text-primary'}`}>
                  Factory
                </Text>
                <Text className="mt-1 text-center text-xs font-sans-medium text-muted-foreground">
                  I want to sell off-cuts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-10 gap-5">
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Company / Business Name</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="Your business name"
                placeholderTextColor="#64748b"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Email Address</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="Create a secure password"
                placeholderTextColor="#64748b"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <View className="mt-auto">
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className={`w-full items-center rounded-xl py-4 shadow-sm ${isLoading ? 'bg-accent/70' : 'bg-accent'}`}>
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-sans-bold text-white">Create Account</Text>
              )}
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm font-sans-medium text-muted-foreground">Already have an account? </Text>
              <Link href="/(auth)/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-sans-bold text-accent">Login</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
