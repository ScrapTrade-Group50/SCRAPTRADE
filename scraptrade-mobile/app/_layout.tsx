import { useEffect } from 'react';
import '../global.css';
import { Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { ROUTES } from '@/utils/routes';

export default function Layout() {
  const { isAuthenticated, isHydrated, role } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  useEffect(() => {
    if (!isHydrated || !rootNavigationState?.key) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inFactoryGroup = segments[0] === '(factory)';
    const inArtisanGroup = segments[0] === '(artisan)';
    const firstSegment = segments[0] as string | undefined;
    const onIndex = !firstSegment || firstSegment === 'index';

    // Let index.tsx handle the initial redirect — avoid fighting it here
    if (onIndex) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace(ROUTES.welcome);
    } else if (isAuthenticated && inAuthGroup) {
      if (role === 'factory') {
        router.replace(ROUTES.factoryDashboard);
      } else if (role === 'artisan') {
        router.replace(ROUTES.artisanFeed);
      }
    } else if (isAuthenticated && role === 'factory' && inArtisanGroup) {
      router.replace(ROUTES.factoryDashboard);
    } else if (isAuthenticated && role === 'artisan' && inFactoryGroup) {
      router.replace(ROUTES.artisanFeed);
    }
  }, [isAuthenticated, isHydrated, role, segments, rootNavigationState?.key, router]);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
