import React from 'react';
import { Stack } from 'expo-router';

/**
 * The artisan area is a Stack so that detail screens (listing detail, checkout,
 * gate pass, profile sub-pages) push on top of the tab bar. This restores the
 * native back button + iOS swipe-back gesture and hides the tab bar on those
 * focused flows — behaviour that a bare Tabs navigator cannot provide.
 */
export default function ArtisanStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="listing-detail" />
      <Stack.Screen name="checkout" />
      <Stack.Screen name="momo-details" />
      <Stack.Screen name="gate-pass" />
      <Stack.Screen name="personal-info" />
    </Stack>
  );
}
