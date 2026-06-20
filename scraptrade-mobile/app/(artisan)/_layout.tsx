import React from 'react';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function ArtisanTabLayout() {
  // Extracting your theme colors for the icons
  const THEME_ACCENT = "#6366f1"; 
  const THEME_MUTED = "#6b7280";  

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
      }}
    >
      {/* 1. Feed Tab */}
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

      {/* 2. NEW: Saved / Bookmarks Tab */}
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

      {/* 3. Gate Pass / Active Orders Tab */}
      <Tabs.Screen
        name="gate-pass"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="tabs-icon">
              <View className={`tabs-pill ${focused ? 'tabs-active' : ''}`}>
                <Feather name="file-text" size={24} color={focused ? THEME_ACCENT : THEME_MUTED} />
              </View>
            </View>
          ),
        }}
      />

      {/* 4. Global Profile Tab (Using the proxy file trick!) */}
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
      {/* We want these screens in the artisan group to be accessible via standard navigation, NOT the tab bar */}
      <Tabs.Screen name="listing-detail" options={{ href: null }} />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="momo-details" options={{ href: null }} />
      <Tabs.Screen name="personal-info" options={{ href: null }} />
    </Tabs>
  );
}