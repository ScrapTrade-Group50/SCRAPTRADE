import React from 'react';
import { Stack } from 'expo-router';

/**
 * The factory area is a Stack so that detail screens (create/edit listing,
 * company details, warehouses) push on top of the tab bar. This restores the
 * native back button + iOS swipe-back gesture and hides the tab bar on those
 * focused flows — behaviour that a bare Tabs navigator cannot provide.
 */
export default function FactoryStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="create-listing" />
      <Stack.Screen name="edit-listing" />
      <Stack.Screen name="company-details" />
      <Stack.Screen name="warehouse-locations" />
      <Stack.Screen name="payout-setup" />
    </Stack>
  );
}
