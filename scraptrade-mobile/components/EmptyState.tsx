import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

type EmptyStateProps = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-12 px-6">
      <View className="h-24 w-24 bg-slate-100 rounded-full items-center justify-center mb-6">
        <Feather name={icon} size={40} color="#94a3b8" />
      </View>
      
      <Text className="text-xl font-bold text-slate-900 mb-2 text-center">
        {title}
      </Text>
      
      <Text className="text-base font-medium text-slate-500 text-center mb-8">
        {message}
      </Text>

      {actionLabel && onAction && (
        <TouchableOpacity 
          onPress={onAction}
          className="bg-orange-50 px-6 py-3 rounded-xl border border-orange-200"
        >
          <Text className="text-sm font-bold text-orange-600">{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}