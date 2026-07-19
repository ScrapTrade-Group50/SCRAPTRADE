import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function FactoryTabLayout() {
  // Extracting your theme colors for the icons
  const THEME_ACCENT = '#6366f1'; // Your indigo active color
  const THEME_MUTED = '#6b7280'; // Your muted gray inactive color

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // We hide the default headers since you built custom ones
        tabBarShowLabel: false, // Hiding text labels for that premium, clean look
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#d1d5db',
          height: 85, // Tall enough to handle the safe area on iPhones
          paddingTop: 10,
        },
      }}>
      {/* 1. Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="grid" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      {/* 2. QR Scanner Tab */}
      <Tabs.Screen
        name="scanner"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="maximize" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      {/* 3. Global Profile Tab (Using href to point outside the factory folder) */}
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="user" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      {/* --- HIDDEN SCREENS --- */}
      {/* We want these screens in the factory group, but NOT on the bottom tab bar */}
      <Tabs.Screen name="create-listing" options={{ href: null }} />
      <Tabs.Screen name="edit-listing" options={{ href: null }} />
      <Tabs.Screen name="company-details" options={{ href: null }} />
      <Tabs.Screen name="warehouse-locations" options={{ href: null }} />
    </Tabs>
  );
}
