import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

export default function SignIn() {
  const login = useAuthStore((state) => state.login);

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          contentContainerClassName="grow justify-center px-6 pb-10 pt-12"
          bounces={false}
          overScrollMode="never">
          
          {/* Header */}
          <View className="mb-12 items-center">
            <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Text className="text-3xl font-sans-bold text-white">ST</Text>
            </View>
            <Text className="text-3xl font-sans-bold text-primary">Welcome Back</Text>
            <Text className="mt-2 text-center text-base font-sans-medium text-muted-foreground">
              Login to access the SCRAPTRADE marketplace
            </Text>
          </View>

          {/* Input Fields */}
          <View className="mb-6 gap-5">
            <View className="gap-2">
              <Text className="text-sm font-sans-semibold text-primary">Email Address</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View className="mt-4 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-sans-semibold text-primary">Password</Text>
                <Link href="/forgot-password" asChild>
                  <TouchableOpacity>
                    <Text className="text-sm font-sans-semibold text-accent">Forgot?</Text>
                  </TouchableOpacity>
                </Link>
              </View>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="Enter your password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>
          </View>

          {/* Action Buttons (Developer Testing Mode) */}
          <View className="mt-8 gap-4">
            
            {/* Factory Login */}
            <TouchableOpacity 
              onPress={() => login('factory')} 
              className="w-full items-center rounded-xl bg-primary py-4 shadow-sm"
            >
              <Text className="text-base font-sans-bold text-white">Login as Factory</Text>
            </TouchableOpacity>

            {/* Artisan Login - THIS IS YOUR NEW DOORWAY */}
            <TouchableOpacity 
              onPress={() => login('artisan')} 
              className="w-full items-center rounded-xl bg-accent py-4 shadow-sm"
            >
              <Text className="text-base font-sans-bold text-white">Login as Artisan</Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm font-sans-medium text-muted-foreground">Do not have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-sm font-sans-bold text-accent">Create Account</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}