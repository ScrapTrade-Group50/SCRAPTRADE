import React from 'react';
import { View } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';

type FeatherIcon = keyof typeof Feather.glyphMap;
type MaterialIcon = keyof typeof MaterialCommunityIcons.glyphMap;

type TabBarIconProps =
  | { library?: 'feather'; name: FeatherIcon; focused: boolean }
  | { library: 'material'; name: MaterialIcon; focused: boolean };

export default function TabBarIcon(props: TabBarIconProps) {
  const colors = useThemeStore((s) => s.colors);
  const { focused } = props;
  const tint = focused ? colors.accent : colors.mutedForeground;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 56, height: 34 }}>
      <View
        style={{
          position: 'absolute',
          width: focused ? 52 : 0,
          height: 30,
          borderRadius: 15,
          backgroundColor: focused ? `${colors.accent}18` : 'transparent',
        }}
      />
      {props.library === 'material' ? (
        <MaterialCommunityIcons name={props.name} size={22} color={tint} />
      ) : (
        <Feather name={props.name} size={22} color={tint} />
      )}
      {focused ? (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: 18,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.accent,
          }}
        />
      ) : null}
    </View>
  );
}
