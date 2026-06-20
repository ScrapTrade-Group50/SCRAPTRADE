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
  }
];

export default function Notifications() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER */}
      <View className="px-6 py-4 bg-white border-b border-slate-200 z-10 flex-row justify-between items-center shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-900">Notifications</Text>
        </View>
        
        {/* Mark all as read button */}
        <TouchableOpacity>
          <Feather name="check-all" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        {MOCK_NOTIFICATIONS.map((note) => (
          <TouchableOpacity 
            key={note.id} 
            className={`flex-row p-5 border-b border-slate-200 ${
              note.isUnread ? 'bg-blue-50/50' : 'bg-white'
            }`}
          >
            {/* Icon */}
            <View className={`h-12 w-12 rounded-full items-center justify-center mr-4 ${note.bgColor}`}>
              <Feather name={note.icon as any} size={20} className={note.color} />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row justify-between items-start mb-1">
                <Text className="text-base font-bold text-slate-900 pr-4 flex-1">
                  {note.title}
                </Text>
                <Text className="text-xs font-medium text-slate-400 mt-1">
                  {note.time}
                </Text>
              </View>
              <Text className="text-sm font-medium text-slate-600 leading-snug">
                {note.message}
              </Text>
            </View>

            {/* Unread Indicator Dot */}
            {note.isUnread && (
              <View className="h-2 w-2 bg-blue-600 rounded-full mt-2 ml-3" />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

    </SafeAreaView>
  );
}