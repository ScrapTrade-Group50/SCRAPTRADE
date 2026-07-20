import React from 'react';
import { View, Text } from 'react-native';
import { useScreenTheme } from '@/hooks/useScreenTheme';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
};

/** Tab-root page title — no divider line; spacing separates content. */
export default function PageHeader({ title, subtitle, right }: PageHeaderProps) {
  const theme = useScreenTheme();
  const { colors } = theme;

  return (
    <View
      style={{
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: colors.background,
      }}>
      <View className="flex-row items-start justify-between">
        <View className="min-w-0 flex-1 pr-3">
          <Text style={theme.type.pageTitle} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-1" style={theme.type.pageSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
