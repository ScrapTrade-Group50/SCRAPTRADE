import React, { useState, useCallback } from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../api/client';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export default function NotificationBell() {
  const router = useRouter();
  const theme = useScreenTheme();
  const { colors } = theme;
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      apiClient
        .get('/notifications/unread-count')
        .then((res) => {
          if (active) setCount(Number(res.data?.count ?? 0));
        })
        .catch(() => {
          // Non-critical; leave badge hidden.
        });
      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      className="h-11 w-11 items-center justify-center rounded-full border"
      style={theme.card}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Feather name="bell" size={22} color={colors.primary} />
      {count > 0 && (
        <View
          className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full border-2 px-1"
          style={{ backgroundColor: colors.destructive, borderColor: colors.background }}>
          <Text className="text-[10px] font-sans-bold text-white">{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
