import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

export default function Welcome() {
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
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
      <View className="flex-1 px-6 pt-12 pb-8">
        <View className="items-center mb-10">
          <View className="bg-accent mb-5 h-20 w-20 items-center justify-center rounded-3xl shadow-sm">
            <Text className="font-sans-extrabold text-4xl text-white">ST</Text>
          </View>
          <Text className="font-sans-extrabold text-primary text-3xl text-center">
            Welcome to SCRAPTRADE
          </Text>
          <Text className="font-sans-medium text-muted-foreground mt-3 text-center text-base px-4">
            The marketplace connecting factories with artisans for industrial off-cuts and surplus
            materials.
          </Text>
        </View>

        <View className="gap-4 flex-1">
          {features.map((feature) => (
            <View
              key={feature.title}
              className="flex-row items-center bg-card border border-border rounded-2xl p-4 shadow-sm">
              <View className="h-12 w-12 bg-accent/10 rounded-full items-center justify-center mr-4">
                <Feather name={feature.icon} size={22} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-primary text-base">{feature.title}</Text>
                <Text className="font-sans-medium text-muted-foreground text-sm mt-0.5">
                  {feature.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="gap-3 mt-6">
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity className="w-full items-center rounded-xl bg-primary py-4 shadow-sm">
              <Text className="font-sans-bold text-base text-white">Get Started</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity className="w-full items-center rounded-xl bg-card border border-border py-4">
              <Text className="font-sans-bold text-base text-primary">I already have an account</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
