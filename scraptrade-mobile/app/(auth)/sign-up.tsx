import React, { useState } from 'react';
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

export default function SignUp() {
  const [role, setRole] = useState<'artisan' | 'factory'>('artisan');

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <ScrollView
          // REMOVED 'justify-center' to stop flexbox conflicts with mt-auto
          contentContainerClassName="grow px-6 pb-10 pt-8"
          bounces={false}
          overScrollMode="never">
          
          {/* 1. Header: Prominent Logo */}
          <View className="mt-4 mb-10 items-center">
            <View className="mb-6 h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Text className="text-3xl font-sans-bold text-white">ST</Text>
            </View>
            <Text className="text-3xl font-sans-bold text-primary">SCRAPTRADE</Text>
            <Text className="mt-2 text-center text-base font-sans-medium text-muted-foreground">
              The Circular Economy Marketplace
            </Text>
          </View>

          {/* 2. Role Toggle: Large Selectable Cards */}
          <View className="mb-8">
            <Text className="mb-3 text-sm font-sans-semibold text-primary">
              I am registering as a:
            </Text>
            <View className="flex-row gap-4">
              {/* Artisan Toggle */}
              <TouchableOpacity
                onPress={() => setRole('artisan')}
                className={`flex-1 items-center justify-center rounded-2xl border-2 p-5 ${
                  role === 'artisan'
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-card'
                }`}>
                <Text
                  className={`text-lg font-sans-bold ${role === 'artisan' ? 'text-accent' : 'text-primary'}`}>
                  Artisan
                </Text>
                <Text className="mt-1 text-center text-xs font-sans-medium text-muted-foreground">
                  I want to buy scrap
                </Text>
              </TouchableOpacity>

              {/* Factory Toggle */}
              <TouchableOpacity
                onPress={() => setRole('factory')}
                className={`flex-1 items-center justify-center rounded-2xl border-2 p-5 ${
                  role === 'factory'
                    ? 'border-accent bg-accent/10'
                    : 'border-border bg-card'
                }`}>
                <Text
                  className={`text-lg font-sans-bold ${role === 'factory' ? 'text-accent' : 'text-primary'}`}>
                  Factory
                </Text>
                <Text className="mt-1 text-center text-xs font-sans-medium text-muted-foreground">
                  I want to sell off-cuts
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Body: Clean Input Fields */}
          <View className="mb-10 gap-5">
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
              <Text className="text-sm font-sans-semibold text-primary">Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                placeholder="Create a secure password"
                placeholderTextColor="#64748b"
                secureTextEntry
              />
            </View>
          </View>

          {/* 4. Action: Massive High-Contrast Button */}
          <View className="mt-auto">
            <TouchableOpacity className="w-full items-center rounded-xl bg-accent py-4 shadow-sm">
              <Text className="text-base font-sans-bold text-white">Create Account</Text>
            </TouchableOpacity>

            <View className="mt-6 flex-row items-center justify-center">
              <Text className="text-sm font-sans-medium text-muted-foreground">Already have an account? </Text>
              <Link href="/sign-in" asChild>
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