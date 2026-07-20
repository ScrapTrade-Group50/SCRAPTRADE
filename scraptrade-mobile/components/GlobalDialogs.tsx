import React from 'react';
import { Modal, View, Text, TouchableOpacity, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useDialogStore } from '@/store/dialogStore';
import { useScreenTheme } from '@/hooks/useScreenTheme';

export default function GlobalDialogs() {
  const theme = useScreenTheme();
  const { colors } = theme;
  const confirm = useDialogStore((s) => s.confirm);
  const notice = useDialogStore((s) => s.notice);
  const hideConfirm = useDialogStore((s) => s.hideConfirm);
  const hideNotice = useDialogStore((s) => s.hideNotice);

  const handleConfirmButton = (button: (typeof confirm.buttons)[number]) => {
    hideConfirm();
    button.onPress?.();
  };

  const noticeIcon =
    notice.variant === 'success'
      ? ('check-circle' as const)
      : notice.variant === 'error'
        ? ('alert-circle' as const)
        : ('info' as const);

  const noticeColor =
    notice.variant === 'success'
      ? colors.success
      : notice.variant === 'error'
        ? colors.destructive
        : colors.accent;

  return (
    <>
      <Modal visible={confirm.visible} transparent animationType="fade" onRequestClose={hideConfirm}>
        <Pressable style={{ flex: 1, ...theme.modalOverlay }} onPress={hideConfirm}>
          <View className="flex-1 items-center justify-center px-6">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border p-6"
              style={{ ...theme.card, borderColor: colors.border }}>
              <Text className="text-xl font-sans-bold" style={theme.textPrimary}>
                {confirm.title}
              </Text>
              {confirm.message ? (
                <Text className="mt-2 text-sm font-sans-medium leading-5" style={theme.textMuted}>
                  {confirm.message}
                </Text>
              ) : null}
              <View className="mt-6 gap-2">
                {confirm.buttons.map((button) => {
                  const isCancel = button.style === 'cancel';
                  const isDestructive = button.style === 'destructive';
                  return (
                    <TouchableOpacity
                      key={button.text}
                      activeOpacity={0.85}
                      onPress={() => handleConfirmButton(button)}
                      className="items-center rounded-xl py-3.5"
                      style={
                        isCancel
                          ? { ...theme.cardMuted }
                          : isDestructive
                            ? { backgroundColor: `${colors.destructive}1A` }
                            : theme.accentFill
                      }>
                      <Text
                        className="text-base font-sans-bold"
                        style={
                          isCancel
                            ? theme.textMuted
                            : isDestructive
                              ? { color: colors.destructive }
                              : theme.textOnAccent
                        }>
                        {button.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <Modal visible={notice.visible} transparent animationType="fade" onRequestClose={hideNotice}>
        <Pressable style={{ flex: 1, ...theme.modalOverlay }} onPress={hideNotice}>
          <View className="flex-1 items-center justify-center px-6">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border p-6"
              style={{ ...theme.card, borderColor: colors.border }}>
              <View className="mb-4 items-center">
                <View
                  className="h-14 w-14 items-center justify-center rounded-full"
                  style={
                    notice.variant === 'success'
                      ? theme.successSoft
                      : notice.variant === 'error'
                        ? { backgroundColor: `${colors.destructive}1A` }
                        : theme.accentSoft
                  }>
                  <Feather name={noticeIcon} size={28} color={noticeColor} />
                </View>
              </View>
              <Text className="text-center text-xl font-sans-bold" style={theme.textPrimary}>
                {notice.title}
              </Text>
              {notice.message ? (
                <Text
                  className="mt-2 text-center text-sm font-sans-medium leading-5"
                  style={theme.textMuted}>
                  {notice.message}
                </Text>
              ) : null}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={hideNotice}
                className="mt-6 items-center rounded-xl py-3.5"
                style={theme.accentFill}>
                <Text className="text-base font-sans-bold" style={theme.textOnAccent}>
                  OK
                </Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}
