import React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { useThemeStore } from '@/store/themeStore';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type ButtonProps = TouchableOpacityProps & {
  label: string;
  loading?: boolean;
  loadingLabel?: string;
  variant?: ButtonVariant;
  className?: string;
};

export default function Button({
  label,
  loading = false,
  loadingLabel,
  variant = 'primary',
  disabled,
  className = '',
  style,
  ...rest
}: ButtonProps) {
  const colors = useThemeStore((s) => s.colors);
  const isDisabled = disabled || loading;

  const variantStyle: ViewStyle =
    variant === 'primary'
      ? { backgroundColor: colors.accent }
      : variant === 'secondary'
        ? {
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
          }
        : variant === 'danger'
          ? {
              backgroundColor: `${colors.destructive}1A`,
              borderWidth: 1,
              borderColor: `${colors.destructive}40`,
            }
          : { backgroundColor: 'transparent' };

  const labelColor =
    variant === 'primary'
      ? colors.onAccent
      : variant === 'danger'
        ? colors.destructive
        : variant === 'ghost'
          ? colors.accent
          : colors.primary;

  const spinnerColor =
    variant === 'primary' ? colors.onAccent : variant === 'danger' ? colors.destructive : colors.accent;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      disabled={isDisabled}
      className={`w-full flex-row items-center justify-center rounded-xl py-4 ${isDisabled ? 'opacity-60' : ''} ${className}`}
      style={[variantStyle, style]}
      {...rest}>
      {loading ? <ActivityIndicator color={spinnerColor} className="mr-2" /> : null}
      <Text className="text-base font-sans-bold" style={{ color: labelColor }}>
        {loading ? loadingLabel ?? label : label}
      </Text>
    </TouchableOpacity>
  );
}
