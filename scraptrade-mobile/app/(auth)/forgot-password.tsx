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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ForgotPassword() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleReset = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    Alert.alert(
      'Link Sent!',
      'If an account exists with that email, you will receive password reset instructions shortly.',
      [{ text: 'Back to Login', onPress: () => router.back() }]
    );
  };

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
              <Feather name="lock" size={32} color="#ea7a53" />
            </View>
            <Text className="text-3xl font-sans-extrabold text-primary text-center mb-2">
              Reset Password
            </Text>
            <Text className="text-base font-sans-medium text-muted-foreground text-center px-4">
              Enter the email address associated with your account and we will send you a link to reset your password.
            </Text>
          </View>

          <View className="gap-2 mb-8">
            <Text className="text-sm font-sans-semibold text-primary">Email Address</Text>
            <View className="flex-row items-center border border-border bg-card rounded-xl px-4 h-14">
              <Feather name="mail" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-base font-sans-medium text-primary h-full"
                placeholder="e.g. factory@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleReset}
            className="w-full items-center rounded-xl bg-accent py-4 shadow-sm">
            <Text className="text-base font-sans-bold text-white">Send Reset Link</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
