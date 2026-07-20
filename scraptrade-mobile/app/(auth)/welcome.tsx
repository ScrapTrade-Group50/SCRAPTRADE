import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export default function Welcome() {
  const theme = useScreenTheme();
  const { colors } = theme;

  const features: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }[] = [
    {
      icon: 'compass',
      title: 'Discover off-cuts',
      subtitle: 'Browse verified factory scrap and surplus materials near you.',
    },
    {
      icon: 'shield',
      title: 'Pay with escrow',
      subtitle: 'Your MoMo payment is held safely until you collect your goods.',
    },
    {
      icon: 'maximize',
      title: 'Scan & collect',
      subtitle: 'Show your gate pass QR at the factory and pick up your order.',
    },
  ];

  return (
    <ThemedSafeAreaView edges={['top', 'bottom']}>
      <View className="flex-1 px-6 pb-8 pt-12">
        <View className="mb-10 items-center">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-3xl"
            style={theme.accentFill}>
            <Text className="text-4xl font-sans-extrabold" style={theme.textOnAccent}>
              ST
            </Text>
          </View>
          <Text className="text-center text-3xl font-sans-extrabold" style={theme.textPrimary}>
            SCRAPTRADE
          </Text>
          <Text className="mt-3 px-4 text-center text-base font-sans-medium" style={theme.textMuted}>
            The marketplace connecting factories with artisans for industrial off-cuts and surplus
            materials.
          </Text>
        </View>

        <View className="flex-1 gap-3">
          {features.map((feature) => (
            <View
              key={feature.title}
              className="flex-row items-center rounded-2xl border p-4"
              style={{ ...theme.card, borderColor: colors.border }}>
              <View
                className="mr-4 h-12 w-12 items-center justify-center rounded-xl"
                style={theme.accentSoft}>
                <Feather name={feature.icon} size={22} color={colors.accent} />
              </View>
              <View className="flex-1">
                <Text className="text-base font-sans-bold" style={theme.textPrimary}>
                  {feature.title}
                </Text>
                <Text className="mt-0.5 text-sm font-sans-medium" style={theme.textMuted}>
                  {feature.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="mt-6 gap-3">
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="w-full items-center rounded-xl py-4" style={theme.accentFill}>
              <Text className="text-base font-sans-bold" style={theme.textOnAccent}>
                Get Started
              </Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity
              className="w-full items-center rounded-xl border py-4"
              style={{ ...theme.card, borderColor: colors.border }}>
              <Text className="text-base font-sans-bold" style={theme.textPrimary}>
                I already have an account
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </ThemedSafeAreaView>
  );
}
