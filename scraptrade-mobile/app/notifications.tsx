import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { apiClient } from '../api/client';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';
import ScreenHeader from '../components/ScreenHeader';
import SegmentedControl from '@/components/SegmentedControl';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';

type AppNotification = {
  id: number;
  title: string;
  body: string;
  type: string;
  referenceId?: number;
  read: boolean;
  createdAt: string;
};

const ICON_BY_TYPE: Record<string, keyof typeof Feather.glyphMap> = {
  ORDER_PAID: 'shopping-bag',
  PICKUP_COMPLETED: 'check-circle',
};

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type NotificationFilter = 'all' | 'unread' | 'orders';

export default function Notifications() {
  const theme = useScreenTheme();
  const { colors, resolved } = theme;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>('all');

  const fetchNotifications = async () => {
    setErrorMessage(null);
    try {
      const response = await apiClient.get('/notifications');
      setNotifications(response.data);
    } catch (error: any) {
      setErrorMessage(error.response?.data?.message || 'Could not load notifications.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const hasUnread = notifications.some((n) => !n.read);

  const filteredNotifications = useMemo(() => {
    if (filter === 'unread') return notifications.filter((n) => !n.read);
    if (filter === 'orders') {
      return notifications.filter((n) => n.type === 'ORDER_PAID' || n.type === 'PICKUP_COMPLETED');
    }
    return notifications;
  }, [notifications, filter]);

  const markAllRead = async () => {
    if (!hasUnread) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await apiClient.patch('/notifications/read-all');
    } catch {
      fetchNotifications();
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (!item.read) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
      try {
        await apiClient.patch(`/notifications/${item.id}/read`);
      } catch {
        // Non-critical; leave optimistic state.
      }
    }
  };

  const renderItem = ({ item }: { item: AppNotification }) => {
    const icon = ICON_BY_TYPE[item.type] ?? 'bell';
    const cardStyle = item.read
      ? theme.card
      : {
          backgroundColor: `${colors.accent}0D`,
          borderColor: `${colors.accent}4D`,
        };
    const iconWrapStyle = item.read
      ? { backgroundColor: colors.background, borderColor: colors.border, borderWidth: 1 }
      : theme.accentSoft;

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handlePress(item)}
        className="mx-6 mb-3 flex-row items-start rounded-2xl border p-4 shadow-sm"
        style={cardStyle}>
        <View
          className="mr-4 h-11 w-11 items-center justify-center rounded-full"
          style={iconWrapStyle}>
          <Feather
            name={icon}
            size={20}
            color={item.read ? colors.mutedForeground : colors.accent}
          />
        </View>
        <View className="flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text
              className="flex-1 pr-2 font-sans-bold text-base"
              style={theme.textPrimary}
              numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && (
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: colors.accent }}
              />
            )}
          </View>
          <Text className="mb-2 font-sans-medium text-sm leading-5" style={theme.textMuted}>
            {item.body}
          </Text>
          <Text className="font-sans-medium text-[11px]" style={theme.textMuted}>
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader
        title="Notifications"
        right={
          hasUnread ? (
            <TouchableOpacity onPress={markAllRead}>
              <Text className="text-sm font-sans-bold" style={theme.textAccent}>
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <SegmentedControl
        options={[
          { key: 'all' as const, label: 'All' },
          { key: 'unread' as const, label: 'Unread' },
          { key: 'orders' as const, label: 'Orders' },
        ]}
        value={filter}
        onChange={setFilter}
      />

      <FlatList
        style={{ flex: 1 }}
        extraData={`${resolved}-${filter}`}
        data={isLoading || errorMessage ? [] : filteredNotifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={() => {
          if (errorMessage) {
            return (
              <EmptyState
                icon="alert-triangle"
                title="Sync Error"
                message={errorMessage}
                actionLabel="Try Again"
                onAction={fetchNotifications}
              />
            );
          }
          if (isLoading) {
            return (
              <View className="px-6">
                <SkeletonCard />
                <SkeletonCard />
              </View>
            );
          }
          if (filter !== 'all') {
            return (
              <EmptyState
                icon="filter"
                title="Nothing here"
                message={`No ${filter === 'unread' ? 'unread' : 'order'} notifications right now.`}
                actionLabel="Show all"
                onAction={() => setFilter('all')}
              />
            );
          }
          return (
            <EmptyState
              icon="bell"
              title="No notifications yet"
              message="Updates about your orders and pickups will appear here."
            />
          );
        }}
      />
    </ThemedSafeAreaView>
  );
}
