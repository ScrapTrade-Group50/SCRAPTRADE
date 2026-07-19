import type { Href } from 'expo-router';

/** Central route constants — `as Href` keeps typedRoutes happy while groups stay transparent at runtime. */
export const ROUTES = {
  welcome: '/(auth)/welcome' as Href,
  signIn: '/(auth)/sign-in' as Href,
  signUp: '/(auth)/sign-up' as Href,
  artisanFeed: '/(artisan)/feed' as Href,
  factoryDashboard: '/(factory)/dashboard' as Href,
  factoryScanner: '/(factory)/(tabs)/scanner' as Href,
} as const;
