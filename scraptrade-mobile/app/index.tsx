import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { ROUTES } from '@/utils/routes';

export default function Index() {
  const { isHydrated, isAuthenticated, role, hydrate } = useAuthStore();
  const accent = useThemeStore((s) => s.colors.accent);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!isHydrated) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={accent} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (role === 'factory') {
    return <Redirect href={ROUTES.factoryDashboard} />;
  }

  return <Redirect href={ROUTES.artisanFeed} />;
}
