import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type TextInputProps,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useThemeStore } from '@/store/themeStore';

type TextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  error?: string | null;
  hint?: string;
  leftIcon?: keyof typeof Feather.glyphMap;
  /** When true, shows a show/hide password toggle (implies secureTextEntry unless overridden). */
  isPassword?: boolean;
  containerClassName?: string;
  labelRight?: React.ReactNode;
};

export default function TextField({
  label,
  error,
  hint,
  leftIcon,
  isPassword = false,
  containerClassName = '',
  labelRight,
  editable = true,
  secureTextEntry,
  onChangeText,
  ...rest
}: TextFieldProps) {
  const colors = useThemeStore((s) => s.colors);
  const [showPassword, setShowPassword] = useState(false);
  const hasError = Boolean(error);

  const secure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View className={`gap-2 ${containerClassName}`}>
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-sans-semibold" style={{ color: colors.primary }}>
          {label}
        </Text>
        {labelRight}
      </View>

      <View
        className={`min-h-14 flex-row items-center rounded-xl border px-4 ${
          hasError ? 'border-destructive' : 'border-border'
        }`}
        style={{
          backgroundColor: !editable
            ? colors.muted
            : hasError
              ? `${colors.destructive}14`
              : colors.background,
          borderColor: hasError ? colors.destructive : colors.border,
        }}>
        {leftIcon ? (
          <Feather
            name={leftIcon}
            size={18}
            color={hasError ? colors.destructive : colors.mutedForeground}
            style={{ marginRight: 10 }}
          />
        ) : null}

        <TextInput
          className="flex-1 py-3.5 text-base font-sans-medium text-primary"
          style={{ color: colors.primary }}
          placeholderTextColor={colors.mutedForeground}
          editable={editable}
          secureTextEntry={secure}
          onChangeText={onChangeText}
          accessibilityLabel={label}
          accessibilityState={{ disabled: !editable }}
          selectionColor={colors.accent}
          {...rest}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            className="-mr-1 p-2"
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={20}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {hasError ? (
        <Text className="text-sm font-sans-medium" style={{ color: colors.destructive }}>
          {error}
        </Text>
      ) : hint ? (
        <Text className="text-xs font-sans-medium" style={{ color: colors.mutedForeground }}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}
