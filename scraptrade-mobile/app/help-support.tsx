import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/client';

const DEFAULT_SUPPORT = {
  email: 'support@scraptrade.com',
  phone: '+233302123456',
  whatsappUrl: 'https://wa.me/233302123456',
  hours: 'Monday through Saturday, 8am to 6pm GMT',
};

const FAQ_ANSWERS: Record<string, string> = {
  'How does Escrow work?':
    'When you pay, funds are held in escrow until the factory scans your gate-pass QR code at pickup. Only then are funds released to the seller.',
  'How long do pickups take?':
    'Pickups are arranged directly with the factory. Most buyers collect within 1–3 business days after payment.',
  'What if the scrap weight is wrong?':
    'Inspect materials at pickup before the factory scans your gate pass. Once scanned, the order is marked complete and escrow is released.',
};

async function openUrl(url: string) {
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert('Unavailable', 'Could not open this link on your device.');
  }
}

export default function HelpSupport() {
  const router = useRouter();
  const [support, setSupport] = useState(DEFAULT_SUPPORT);

  useEffect(() => {
    let active = true;
    apiClient
      .get('/support')
      .then((res) => {
        if (!active || !res.data) return;
        setSupport({
          email: res.data.email || DEFAULT_SUPPORT.email,
          phone: res.data.phone || DEFAULT_SUPPORT.phone,
          whatsappUrl: res.data.whatsappUrl || DEFAULT_SUPPORT.whatsappUrl,
          hours: res.data.hours || DEFAULT_SUPPORT.hours,
        });
      })
      .catch(() => {
        // Fall back to defaults.
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Help & Support</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-sans-extrabold text-primary mb-2">How can we help?</Text>
        <Text className="text-base font-sans-medium text-muted-foreground mb-8">
          Our team is available {support.hours} to assist with your trades.
        </Text>

        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            onPress={() => openUrl(support.whatsappUrl)}
            className="flex-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-5 items-center mr-2 shadow-sm">
            <FontAwesome5 name="whatsapp" brand size={28} color="#25D366" className="mb-3" />
            <Text className="text-sm font-sans-bold text-primary">Chat</Text>
            <Text className="text-xs font-sans-medium text-muted-foreground text-center mt-1">
              Quick replies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openUrl(`mailto:${support.email}`)}
            className="flex-1 bg-accent/10 border border-accent/20 rounded-2xl p-5 items-center ml-2 shadow-sm">
            <Feather name="mail" size={28} color="#6366f1" className="mb-3" />
            <Text className="text-sm font-sans-bold text-primary">Email</Text>
            <Text className="text-xs font-sans-medium text-muted-foreground text-center mt-1">
              {support.email}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => openUrl(`tel:${support.phone}`)}
          className="w-full flex-row items-center justify-between bg-card border border-border rounded-2xl p-4 mb-10 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-12 w-12 bg-background rounded-full items-center justify-center mr-4 border border-border">
              <Feather name="phone-call" size={20} color="#0b1f1a" />
            </View>
            <View>
              <Text className="text-base font-sans-bold text-primary">Call Support Line</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground mt-0.5">
                {support.phone}
              </Text>
            </View>
          </View>
          <View className="bg-accent px-4 py-2 rounded-full">
            <Text className="text-xs font-sans-bold text-white">CALL</Text>
          </View>
        </TouchableOpacity>

        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
          Frequently Asked Questions
        </Text>

        <View className="bg-card border border-border rounded-2xl mb-12 overflow-hidden shadow-sm">
          {Object.entries(FAQ_ANSWERS).map(([question, answer], index, arr) => (
            <TouchableOpacity
              key={question}
              onPress={() => Alert.alert(question, answer)}
              className={`flex-row items-center justify-between p-4 ${index !== arr.length - 1 ? 'border-b border-border' : ''}`}>
              <Text className="text-sm font-sans-bold text-primary flex-1 pr-4">{question}</Text>
              <Feather name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
