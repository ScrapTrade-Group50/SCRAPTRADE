import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrivacySecurity() {
  const router = useRouter();
  
  // Local state for our toggle switches
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Privacy & Security</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* SECTION: Login & Security */}
        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          Login & Security
        </Text>
        
        <View className="bg-card border border-border rounded-2xl mb-8 shadow-sm overflow-hidden">
          {/* Change Password */}
          <TouchableOpacity className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-4 border border-border">
                <Feather name="lock" size={20} color="#0b1f1a" />
              </View>
              <View>
                <Text className="text-base font-sans-bold text-primary">Change Password</Text>
                <Text className="text-xs font-sans-medium text-muted-foreground mt-0.5">Updated 3 months ago</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>

          {/* Biometric Toggle */}
          <View className="flex-row items-center justify-between p-4 border-b border-border">
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-4 border border-border">
                <Feather name="smile" size={20} color="#0b1f1a" />
              </View>
              <Text className="text-base font-sans-bold text-primary">Face ID / Touch ID</Text>
            </View>
            <Switch 
              value={biometricEnabled} 
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
              thumbColor={'#ffffff'}
            />
          </View>

          {/* 2FA Toggle */}
          <View className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-4 border border-border">
                <Feather name="shield" size={20} color="#0b1f1a" />
              </View>
              <Text className="text-base font-sans-bold text-primary">Two-Factor Auth</Text>
            </View>
            <Switch 
              value={twoFactorEnabled} 
              onValueChange={setTwoFactorEnabled}
              trackColor={{ false: '#e2e8f0', true: '#6366f1' }}
              thumbColor={'#ffffff'}
            />
          </View>
        </View>

        {/* SECTION: Danger Zone */}
        <Text className="text-sm font-sans-bold text-red-500/70 uppercase tracking-widest mb-3 ml-1 mt-2">
          Danger Zone
        </Text>
        
        <TouchableOpacity className="w-full flex-row items-center justify-between bg-card border border-red-100 rounded-2xl p-4 mb-10 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-red-50 rounded-full items-center justify-center mr-4">
              <Feather name="trash-2" size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-base font-sans-bold text-red-600">Delete Account</Text>
              <Text className="text-xs font-sans-medium text-red-400 mt-0.5">Permanently remove your data</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}