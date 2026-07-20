import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

type FeatherIcon = keyof typeof Feather.glyphMap;
type MaterialIcon = keyof typeof MaterialCommunityIcons.glyphMap;

type TabGlyphProps =
  | { library?: 'feather'; name: FeatherIcon; color: string; size?: number }
  | { library: 'material'; name: MaterialIcon; color: string; size?: number };

export default function TabGlyph(props: TabGlyphProps) {
  const size = props.size ?? 22;
  if (props.library === 'material') {
    return <MaterialCommunityIcons name={props.name} size={size} color={props.color} />;
  }
  return <Feather name={props.name} size={size} color={props.color} />;
}
