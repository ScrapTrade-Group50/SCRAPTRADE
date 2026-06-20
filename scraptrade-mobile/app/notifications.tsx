import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock Notification Data
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    type: 'ESCROW_RELEASE',
    title: 'Payment Released',
    message: 'The factory scanned your gate pass. 450 GHS has been released from Escrow.',
    time: '2 mins ago',
    isUnread: true,
    icon: 'check-circle',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: '2',
    type: 'NEW_ORDER',
    title: 'New Gate Pass Generated',
    message: 'Kwame Mensah has paid for "Hardwood Timber Ends". Awaiting pickup.',
    time: '1 hour ago',
    isUnread: true,
    icon: 'file-text',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: '3',
    type: 'SYSTEM',
    title: 'Welcome to SCRAPTRADE',
    message: 'Your account has been successfully verified. Start trading today!',
    time: '2 days ago',
    isUnread: false,
    icon: 'award',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
];

export default function Notifications() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" style={{ flex: 1 }} edges={['top']}>
      {/* HEADER */}
      <View className="z-10 flex-row items-center justify-between border-b border-slate-200 bg-white px-6 py-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
        </View>

        {/* Mark all as read button */}
        <TouchableOpacity>
          <Feather name="check" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}>
        {MOCK_NOTIFICATIONS.map((note) => (
          <TouchableOpacity
            key={note.id}
            className={`flex-row border-b border-slate-200 p-5 ${
              note.isUnread ? 'bg-blue-50/50' : 'bg-white'
            }`}>
            {/* Icon */}
            <View
              className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${note.bgColor}`}>
              <Feather name={note.icon as any} size={20} className={note.color} />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="mb-1 flex-row items-start justify-between">
                <Text className="flex-1 pr-4 text-base font-bold text-slate-900">{note.title}</Text>
                <Text className="mt-1 text-xs font-medium text-slate-400">{note.time}</Text>
              </View>
              <Text className="text-sm leading-snug font-medium text-slate-600">
                {note.message}
              </Text>
            </View>

            {/* Unread Indicator Dot */}
            {note.isUnread && <View className="mt-2 ml-3 h-2 w-2 rounded-full bg-blue-600" />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
