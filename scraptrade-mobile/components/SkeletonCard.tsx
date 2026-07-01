import React from 'react';
import { View } from 'react-native';

export default function SkeletonCard() {
  return (
    <View className="bg-card border border-border mb-4 flex-row items-center rounded-2xl p-3 shadow-sm opacity-60">
      {/* Image Placeholder */}
      <View className="h-24 w-24 rounded-xl bg-muted" />
      
      {/* Content Placeholder */}
      <View className="ml-4 flex-1 justify-center">
        {/* Category & Bookmark Row */}
        <View className="flex-row justify-between items-center mb-2">
          <View className="h-3 w-16 bg-muted rounded-md" />
          <View className="h-4 w-4 bg-muted rounded-md" />
        </View>

        {/* Title */}
        <View className="h-5 w-3/4 bg-muted rounded-md mb-2" />
        
        {/* Weight / Specs */}
        <View className="h-3 w-1/2 bg-muted rounded-md mb-3" />
        
        {/* Price */}
        <View className="h-6 w-24 bg-muted rounded-md" />
      </View>
    </View>
  );
}