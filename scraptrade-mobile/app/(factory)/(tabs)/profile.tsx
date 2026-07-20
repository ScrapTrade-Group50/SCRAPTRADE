import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { useRouter, Link } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { ROUTES } from '@/utils/routes';
import PageHeader from '@/components/PageHeader';
import { showConfirm } from '@/utils/alert';

export default function FactoryProfile() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const companyName = useAuthStore((state) => state.companyName);
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const toggleDark = useThemeStore((s) => s.toggleDark);

  const user = {
    name: companyName || 'Factory User',
    role: 'Factory (Seller)',
  };

  const handleLogout = () => {
    showConfirm('Sign Out', 'Are you sure you want to log out of SCRAPTRADE?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            router.replace(ROUTES.welcome);
          } catch (error) {
            console.error('Error during logout:', error);
          }
        },
      },
    ]);
  };

  const renderMenuItem = (
    icon: keyof typeof Feather.glyphMap,
    title: string,
    subtitle?: string,
    href?: string
  ) => {
    const MenuItemContent = (
      <TouchableOpacity
        className="mb-3 flex-row items-center justify-between rounded-2xl border p-4"
        style={theme.card}>
        <View className="flex-row items-center">
          <View
            className="mr-4 h-10 w-10 items-center justify-center rounded-full border"
            style={{ backgroundColor: colors.background, borderColor: colors.border }}>
            <Feather name={icon} size={20} color={colors.primary} />
          </View>
          <View>
            <Text className="text-base font-sans-bold" style={theme.textPrimary}>
              {title}
            </Text>
            {subtitle && (
              <Text className="mt-0.5 text-xs font-sans-medium" style={theme.textMuted}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
        <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    );

    if (href) {
      return (
        <Link href={href as any} asChild>
          {MenuItemContent}
        </Link>
      );
    }

    return MenuItemContent;
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <PageHeader title="Factory Profile" subtitle="Business and account settings" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <View className="mb-8 items-center rounded-3xl border p-6" style={theme.card}>
          <View
            className="mb-4 h-24 w-24 items-center justify-center rounded-full border-4"
            style={{ borderColor: colors.card, backgroundColor: `${colors.accent}1A` }}>
            <Text className="text-3xl font-sans-bold" style={theme.textAccent}>
              {user.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <Text className="text-center" style={theme.type.cardTitle}>
            {user.name}
          </Text>
          <View
            className="mt-2 rounded-full border px-3 py-1"
            style={{ ...theme.accentSoft, borderColor: `${colors.accent}33` }}>
            <Text className="text-xs font-sans-bold" style={theme.textAccent}>
              {user.role}
            </Text>
          </View>
        </View>

        <Text className="mb-3 ml-2" style={theme.type.sectionLabel}>
          Appearance
        </Text>
        <View
          className="mb-3 flex-row items-center justify-between rounded-2xl border p-4"
          style={theme.card}>
          <View className="flex-row items-center">
            <View
              className="mr-4 h-10 w-10 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.background, borderColor: colors.border }}>
              <Feather
                name={resolved === 'dark' ? 'moon' : 'sun'}
                size={20}
                color={colors.accent}
              />
            </View>
            <View>
              <Text className="text-base font-sans-bold" style={theme.textPrimary}>
                {resolved === 'dark' ? 'Dark theme' : 'Light theme'}
              </Text>
              <Text className="mt-0.5 text-xs font-sans-medium" style={theme.textMuted}>
                {resolved === 'dark' ? 'On — easier on the eyes' : 'On — bright interface'}
              </Text>
            </View>
          </View>
          <Switch
            value={resolved === 'dark'}
            onValueChange={() => {
              void toggleDark();
            }}
            trackColor={{ false: colors.muted, true: colors.accent }}
            thumbColor={colors.card}
            ios_backgroundColor={colors.muted}
          />
        </View>

        <Text className="mb-3 ml-2 mt-6" style={theme.type.sectionLabel}>
          Business
        </Text>
        {renderMenuItem(
          'briefcase',
          'Company Details',
          'Business name and contact info',
          '/(factory)/company-details'
        )}
        {renderMenuItem(
          'dollar-sign',
          'Payout Account',
          'MoMo wallet for escrow releases',
          '/(factory)/payout-setup'
        )}
        {renderMenuItem(
          'map-pin',
          'Warehouses',
          'Manage your pickup locations',
          '/(factory)/warehouse-locations'
        )}

        <Text className="mb-3 ml-2 mt-6" style={theme.type.sectionLabel}>
          Support
        </Text>
        {renderMenuItem(
          'shield',
          'Privacy & Security',
          'Password and account settings',
          '/privacy-security'
        )}
        {renderMenuItem('help-circle', 'Help & Support', 'Contact SCRAPTRADE support', '/help-support')}

        <TouchableOpacity
          onPress={handleLogout}
          className="mt-8 w-full flex-row items-center justify-center rounded-xl border py-4"
          style={{
            borderColor: `${colors.destructive}33`,
            backgroundColor: `${colors.destructive}1A`,
          }}>
          <Feather name="log-out" size={20} color={colors.destructive} />
          <Text className="ml-2 text-base font-sans-bold" style={{ color: colors.destructive }}>
            Sign Out
          </Text>
        </TouchableOpacity>

        <Text className="mt-8 text-center text-xs font-sans-medium" style={theme.textMuted}>
          SCRAPTRADE v1.0.0
        </Text>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
