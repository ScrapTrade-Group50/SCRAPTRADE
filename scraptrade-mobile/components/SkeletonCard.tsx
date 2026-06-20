import React from 'react';
import { View } from 'react-native';

export default function SkeletonCard() {
  return (
    <View className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-6 shadow-sm opacity-70">
      {/* Image Placeholder */}
      <View className="w-full h-56 bg-slate-200" />
      
      {/* Content Placeholder */}
      <View className="p-5">
        {/* Category Badge & Distance */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="h-6 w-16 bg-slate-200 rounded-md" />
          <View className="h-4 w-12 bg-slate-200 rounded-md" />
        </View>

        {/* Title */}
        <View className="h-8 w-3/4 bg-slate-200 rounded-md mb-6" />

        {/* Bottom Row: Weight & Price */}
        <View className="flex-row justify-between items-end">
          <View className="gap-2">
            <View className="h-4 w-20 bg-slate-200 rounded-md" />
            <View className="h-6 w-16 bg-slate-200 rounded-md" />
          </View>
          <View className="gap-2 items-end">
            <View className="h-4 w-24 bg-slate-200 rounded-md" />
            <View className="h-8 w-24 bg-slate-200 rounded-md" />
          </View>
        </View>
      </View>
    </View>
  );
}