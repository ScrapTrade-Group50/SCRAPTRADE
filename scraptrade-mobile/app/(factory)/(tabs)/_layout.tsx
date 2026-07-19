import React from 'react';
import { Tabs } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function FactoryTabLayout() {
  const THEME_ACCENT = '#6366f1';
  const THEME_MUTED = '#6b7280';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: THEME_ACCENT,
        tabBarInactiveTintColor: THEME_MUTED,
        tabBarLabelStyle: {
          fontFamily: 'sans-semibold',
          fontSize: 11,
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#d1d5db',
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="grid" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <MaterialCommunityIcons
                  name="qrcode-scan"
                  size={24}
                  color={focused ? THEME_ACCENT : THEME_MUTED}
                />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Sales',
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="file-text" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="user" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
