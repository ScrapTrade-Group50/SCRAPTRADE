import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '../api/client';
import ScreenHeader from '../components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { showErrorNotice } from '@/utils/alert';

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
    showErrorNotice('Unavailable', 'Could not open this link on your device.');
  }
}

export default function HelpSupport() {
  const theme = useScreenTheme();
  const { colors } = theme;
  const [support, setSupport] = useState(DEFAULT_SUPPORT);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

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
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Help & Support" subtitle={`Available ${support.hours}`} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-4 pb-12"
        showsVerticalScrollIndicator={false}>
        <View className="mb-8 flex-row justify-between">
          <TouchableOpacity
            onPress={() => openUrl(support.whatsappUrl)}
            className="mr-2 flex-1 items-center rounded-2xl border p-5 shadow-sm"
            style={{
              backgroundColor: 'rgba(37, 211, 102, 0.1)',
              borderColor: 'rgba(37, 211, 102, 0.2)',
            }}>
            <FontAwesome5 name="whatsapp" brand size={28} color="#25D366" className="mb-3" />
            <Text className="text-sm font-sans-bold" style={theme.textPrimary}>
              Chat
            </Text>
            <Text className="mt-1 text-center text-xs font-sans-medium" style={theme.textMuted}>
              Quick replies
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openUrl(`mailto:${support.email}`)}
            className="ml-2 flex-1 items-center rounded-2xl border p-5 shadow-sm"
            style={theme.accentSoft}>
            <Feather name="mail" size={28} color={colors.accent} className="mb-3" />
            <Text className="text-sm font-sans-bold" style={theme.textPrimary}>
              Email
            </Text>
            <Text className="mt-1 text-center text-xs font-sans-medium" style={theme.textMuted}>
              {support.email}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => openUrl(`tel:${support.phone}`)}
          className="mb-10 w-full flex-row items-center justify-between rounded-2xl border p-4 shadow-sm"
          style={theme.card}>
          <View className="flex-row items-center">
            <View
              className="mr-4 h-12 w-12 items-center justify-center rounded-full border"
              style={{ backgroundColor: colors.background, borderColor: colors.border }}>
              <Feather name="phone-call" size={20} color={colors.primary} />
            </View>
            <View>
              <Text className="text-base font-sans-bold" style={theme.textPrimary}>
                Call Support Line
              </Text>
              <Text className="mt-0.5 text-sm font-sans-medium" style={theme.textMuted}>
                {support.phone}
              </Text>
            </View>
          </View>
          <View className="rounded-full px-4 py-2" style={theme.accentFill}>
            <Text className="text-xs font-sans-bold" style={theme.textOnAccent}>
              CALL
            </Text>
          </View>
        </TouchableOpacity>

        <Text className="mb-4 ml-1" style={theme.type.sectionLabel}>
          Frequently Asked Questions
        </Text>

        <View className="mb-12 overflow-hidden rounded-2xl border shadow-sm" style={theme.card}>
          {Object.entries(FAQ_ANSWERS).map(([question, answer], index, arr) => {
            const open = expandedFaq === question;
            return (
              <View
                key={question}
                style={index !== arr.length - 1 ? { borderBottomWidth: 1, borderBottomColor: colors.border } : undefined}>
                <TouchableOpacity
                  onPress={() => setExpandedFaq(open ? null : question)}
                  className="flex-row items-center justify-between p-4">
                  <Text className="flex-1 pr-4 text-sm font-sans-bold" style={theme.textPrimary}>
                    {question}
                  </Text>
                  <Feather
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.mutedForeground}
                  />
                </TouchableOpacity>
                {open ? (
                  <Text className="px-4 pb-4 text-sm font-sans-medium leading-6" style={theme.textMuted}>
                    {answer}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}
