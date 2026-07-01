import { useEffect } from 'react';
import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { isAuthenticated, isHydrated, role, hydrate } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isAuthenticated && inAuthGroup) {
      if (role === 'factory') {
        router.replace('/(factory)/dashboard');
      } else if (role === 'artisan') {
        router.replace('/(artisan)/feed');
      }
    }
  }, [isAuthenticated, isHydrated, role, segments, rootNavigationState?.key, router]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
