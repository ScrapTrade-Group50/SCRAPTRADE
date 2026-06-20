import { useEffect } from 'react';
import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';

export default function Layout() {
  const { isAuthenticated, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!rootNavigationState?.key) return;

    // THE FIX: Expo Router sees the folder name '(auth)' as the first segment!
    const inAuthGroup = segments[0] === '(auth)';

    setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/(auth)/sign-in'); // Explicitly routing to the auth folder
      } else if (isAuthenticated && inAuthGroup) {
        if (role === 'factory') {
          router.replace('/(factory)/dashboard');
        } else if (role === 'artisan') {
          router.replace('/(artisan)/feed');
        }
      }
    }, 0);
  }, [isAuthenticated, role, segments, rootNavigationState?.key]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
