import React from 'react';
import { Tabs } from 'expo-router';
import AppTabBar from '@/components/AppTabBar';
import TabGlyph from '@/components/TabGlyph';

export default function ArtisanTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <TabGlyph name="compass" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size }) => <TabGlyph name="bookmark" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <TabGlyph name="file-text" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <TabGlyph name="user" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
