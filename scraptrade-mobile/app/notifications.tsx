import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { apiClient } from '../api/client';
import SkeletonCard from '../components/SkeletonCard';
import EmptyState from '../components/EmptyState';

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

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => handlePress(item)}
        className={`mx-5 mb-3 flex-row items-start rounded-2xl border p-4 shadow-sm ${
          item.read ? 'bg-card border-border' : 'bg-accent/5 border-accent/30'
        }`}>
        <View
          className={`h-11 w-11 items-center justify-center rounded-full mr-4 ${
            item.read ? 'bg-background border border-border' : 'bg-accent/10'
          }`}>
          <Feather name={icon} size={20} color={item.read ? '#64748b' : '#6366f1'} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-sans-bold text-primary text-base flex-1 pr-2" numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View className="h-2.5 w-2.5 rounded-full bg-accent" />}
          </View>
          <Text className="font-sans-medium text-muted-foreground text-sm leading-5 mb-2">
            {item.body}
          </Text>
          <Text className="font-sans-medium text-muted-foreground text-[11px]">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-background border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0b1f1a" />
          </TouchableOpacity>
          <Text className="text-xl font-sans-bold text-primary">Notifications</Text>
        </View>
        {hasUnread && (
          <TouchableOpacity onPress={markAllRead}>
            <Text className="text-sm font-sans-bold text-accent">Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={isLoading || errorMessage ? [] : notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
              <View className="px-5">
                <SkeletonCard />
                <SkeletonCard />
              </View>
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
    </SafeAreaView>
  );
}
