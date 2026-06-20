import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';

export default function Checkout() {
  const router = useRouter();
  const [momoNumber, setMomoNumber] = useState('');

  // Mock Pricing
  const itemPrice = 450;
  const escrowFee = 15;
  const total = itemPrice + escrowFee;

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER: Navigation */}
      <View className="flex-row items-center px-6 py-4 bg-background">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Secure Checkout</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="px-6 py-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          {/* 1. Summary Card */}
          <View className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-8">
            <Text className="text-lg font-sans-bold text-primary mb-4">Order Summary</Text>
            
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-base font-sans-medium text-muted-foreground">High-Carbon Steel Off-cuts</Text>
              <Text className="text-base font-sans-semibold text-primary">{itemPrice} GHS</Text>
            </View>
            
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <Text className="text-base font-sans-medium text-muted-foreground mr-2">Escrow Protection Fee</Text>
                <Feather name="shield" size={14} color="#10b981" />
              </View>
              <Text className="text-base font-sans-semibold text-primary">{escrowFee} GHS</Text>
            </View>

            <View className="h-px w-full bg-border mb-4" />

            <View className="flex-row justify-between items-center">
              <Text className="text-xl font-sans-bold text-primary">Total to Pay</Text>
              {/* Keeping the semantic green for the final price */}
              <Text className="text-2xl font-sans-extrabold text-green-600">{total} GHS</Text>
            </View>
          </View>

          {/* 2. MoMo Details */}
          <Text className="text-lg font-sans-bold text-primary mb-4">Payment Details</Text>
          
          <View className="gap-2 mb-6">
            <Text className="text-sm font-sans-semibold text-primary">Mobile Money Number</Text>
            <View className="flex-row items-center border border-border bg-card rounded-xl px-4 h-14">
              <Feather name="smartphone" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-3 text-base font-sans-medium text-primary h-full"
                placeholder="e.g. 024 123 4567"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={momoNumber}
                onChangeText={setMomoNumber}
                maxLength={10}
              />
            </View>
            <Text className="text-xs font-sans-medium text-muted-foreground mt-1">
              Supports MTN, Telecel, and ATMoney. A prompt will be sent to your phone.
            </Text>
          </View>

          {/* Escrow Trust Badge */}
          {/* Kept semantic green colors for trust/security context */}
          <View className="flex-row items-center bg-green-50 p-4 rounded-xl mb-10 border border-green-100">
            <View className="h-10 w-10 bg-green-100 rounded-full items-center justify-center mr-3">
              <Feather name="lock" size={20} color="#15803d" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-sans-bold text-green-800">Funds Held in Escrow</Text>
              <Text className="text-xs font-sans-medium text-green-700 mt-0.5">
                The factory won't receive this money until you scan the gate pass at pickup.
              </Text>
            </View>
          </View>

          {/* 3. Action: Confirm Payment Button */}
          {/* We link this straight to the Gate Pass screen to simulate a successful payment */}
          <Link href="/gate-pass" asChild>
            <TouchableOpacity className="w-full items-center rounded-xl bg-green-600 py-4 shadow-sm mb-6 flex-row justify-center gap-3">
              <Text className="text-base font-sans-bold text-white">Confirm Payment</Text>
              <Feather name="arrow-right" size={20} color="#ffffff" />
            </TouchableOpacity>
          </Link>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}