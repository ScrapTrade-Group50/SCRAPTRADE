import React from 'react';
import { Tabs } from 'expo-router';
import AppTabBar from '@/components/AppTabBar';
import TabGlyph from '@/components/TabGlyph';

export default function FactoryTabLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <TabGlyph name="grid" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <TabGlyph library="material" name="qrcode-scan" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Sales',
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
