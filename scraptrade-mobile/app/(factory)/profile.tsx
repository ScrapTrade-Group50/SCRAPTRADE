import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage'; // <-- Imported AsyncStorage
import { useAuthStore } from '@/store/authStore';

export default function FactoryProfile() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  // Mock Factory Data
  const user = {
    name: "Tema Steel Works",
    role: "Factory (Seller)",
    phone: "024 987 6543",
    memberSince: "Jan 2022"
  };

  const THEME_PRIMARY = "#0b1f1a";

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to log out of SCRAPTRADE?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Sign Out", 
          style: "destructive", 
          onPress: async () => {
            try {
              // 1. Clear global state (your existing Zustand logic)
              logout(); 
              
              // 2. Shred the VIP token from the phone's secure memory
              await AsyncStorage.removeItem('token'); 
              
              // 3. Immediately redirect them to the Auth stack
              router.replace('/(auth)/sign-in');
              
            } catch (error) {
              console.error("Error during logout:", error);
            }
          } 
        }
      ]
    );
  };

  const renderMenuItem = (icon: any, title: string, subtitle?: string, href?: string) => {
    const MenuItemContent = (
      <TouchableOpacity className="flex-row items-center justify-between bg-card p-4 rounded-2xl mb-3 border border-border shadow-sm">
        <View className="flex-row items-center">
          <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-4 border border-border">
            <Feather name={icon} size={20} color={THEME_PRIMARY} />
          </View>
          <View>
            <Text className="text-base font-sans-bold text-primary">{title}</Text>
            {subtitle && <Text className="text-xs font-sans-medium text-muted-foreground mt-0.5">{subtitle}</Text>}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color="#cbd5e1" />
      </TouchableOpacity>
    );

    if (href) {
      return (
        <Link href={href as any} asChild>
          {MenuItemContent}
        </Link>
      );
    }

    return MenuItemContent;
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER: Navigation */}
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color={THEME_PRIMARY} />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Factory Profile</Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        
        {/* 1. Factory Info Card */}
        <View className="bg-card rounded-3xl p-6 border border-border shadow-sm items-center mb-8">
          <View className="h-24 w-24 bg-accent/10 rounded-full items-center justify-center mb-4 border-4 border-card shadow-sm">
            <Text className="text-3xl font-sans-bold text-accent">
              {user.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <Text className="text-2xl font-sans-bold text-primary text-center">{user.name}</Text>
          <View className="bg-accent/10 px-3 py-1 rounded-full mt-2 border border-accent/20">
            <Text className="text-xs font-sans-bold text-accent">{user.role}</Text>
          </View>
        </View>

        {/* 2. Business Settings */}
        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2">Business Settings</Text>
        {renderMenuItem("briefcase", "Company Details", "Registration and contact info", "/company-details")}
        {renderMenuItem("dollar-sign", "Payout Methods", "Manage your bank and MoMo details", "/momo-details")}
        {renderMenuItem("map-pin", "Warehouse Locations", "Manage your scrap pickup addresses", "/warehouse-locations")}
        {renderMenuItem("bar-chart-2", "Sales History", "View your past sales and revenue", "/transactions")}

        {/* 3. Preferences */}
        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-2 mt-6">Preferences</Text>
        {renderMenuItem("bell", "Notifications", "Alerts for new orders and pickups", "/notifications")}
        {renderMenuItem("shield", "Privacy & Security", "Password and app lock", "/privacy-security")}
        {renderMenuItem("help-circle", "Help & Support", "Contact SCRAPTRADE support", "/help-support")}
        
        {/* 4. Log Out Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="w-full flex-row items-center justify-center rounded-xl bg-red-50 py-4 mt-8 border border-red-100"
        >
          <Feather name="log-out" size={20} color="#ef4444" />
          <Text className="text-base font-sans-bold text-red-500 ml-2">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-xs font-sans-medium text-muted-foreground mt-8">
          SCRAPTRADE v1.0.0
        </Text>

      </ScrollView>
    </SafeAreaView>
  );
}