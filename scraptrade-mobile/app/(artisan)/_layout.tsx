import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function ArtisanTabLayout() {
  const THEME_ACCENT = '#6366f1';
  const THEME_MUTED = '#6b7280';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#d1d5db',
          height: 85,
          paddingTop: 10,
        },
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="compass" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="bookmark" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

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

      <Tabs.Screen name="listing-detail" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="gate-pass" options={{ href: null }} />
      <Tabs.Screen name="momo-details" options={{ href: null }} />
      <Tabs.Screen name="personal-info" options={{ href: null }} />
    </Tabs>
  );
}
