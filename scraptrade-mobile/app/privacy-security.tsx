import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/client';
import { showAlert } from '../utils/alert';
import { getApiErrorMessage } from '../utils/apiErrors';
import { useAuthStore } from '../store/authStore';
import ScreenHeader from '../components/ScreenHeader';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import { Button, TextField } from '@/components/ui';
import {
  required,
  validatePassword,
  validatePasswordMatch,
  type FieldErrors,
  hasErrors,
} from '@/utils/validation';

type PasswordFields = 'currentPassword' | 'newPassword' | 'confirmPassword';
type DeleteFields = 'deletePassword';

export default function PrivacySecurity() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const theme = useScreenTheme();
  const { colors } = theme;

  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<FieldErrors<PasswordFields>>({});
  const [deleteErrors, setDeleteErrors] = useState<FieldErrors<DeleteFields>>({});

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordErrors({});
  };

  const validatePasswordForm = () => {
    const next: FieldErrors<PasswordFields> = {
      currentPassword: required(currentPassword, 'Current password') ?? undefined,
      newPassword: validatePassword(newPassword, { min: 6 }) ?? undefined,
      confirmPassword:
        validatePassword(confirmPassword, { min: 6 }) ??
        validatePasswordMatch(newPassword, confirmPassword) ??
        undefined,
    };
    if (!next.confirmPassword) {
      next.confirmPassword = validatePasswordMatch(newPassword, confirmPassword) ?? undefined;
    }
    setPasswordErrors(next);
    return !hasErrors(next);
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;
    setIsSaving(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordModal(false);
      resetPasswordForm();
      showAlert('Success', 'Your password has been changed.');
    } catch (error: any) {
      showAlert('Error', getApiErrorMessage(error, 'Could not change password.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    const next: FieldErrors<DeleteFields> = {
      deletePassword: required(deletePassword, 'Password') ?? undefined,
    };
    setDeleteErrors(next);
    if (hasErrors(next)) return;
    setIsSaving(true);
    try {
      await apiClient.delete('/auth/me', { data: { password: deletePassword } });
      setDeleteModal(false);
      setDeletePassword('');
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error: any) {
      showAlert('Error', getApiErrorMessage(error, 'Could not delete account.'));
    } finally {
      setIsSaving(false);
    }
  };

  const renderModalSheet = (
    title: string,
    titleStyle: { color: string },
    body: React.ReactNode,
    onClose: () => void
  ) => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-end"
      style={theme.modalOverlay}>
      <View
        className="rounded-t-[32px] px-6 pt-4 pb-10"
        style={[theme.varStyle, { backgroundColor: colors.background }]}>
        <View className="items-center pb-2">
          <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.border }} />
        </View>
        <Text className="mb-6 text-xl font-sans-bold" style={titleStyle}>
          {title}
        </Text>
        {body}
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <ThemedSafeAreaView edges={['top']}>
      <ScreenHeader title="Privacy & Security" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <Text
          className="mb-3 ml-1 text-sm font-sans-bold uppercase tracking-widest"
          style={theme.sectionLabel}>
          Login & Security
        </Text>

        <View className="mb-8 overflow-hidden rounded-2xl border shadow-sm" style={theme.card}>
          <TouchableOpacity
            onPress={() => setPasswordModal(true)}
            className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View
                className="mr-4 h-10 w-10 items-center justify-center rounded-full border"
                style={{ backgroundColor: colors.background, borderColor: colors.border }}>
                <Feather name="lock" size={20} color={colors.primary} />
              </View>
              <View>
                <Text className="text-base font-sans-bold" style={theme.textPrimary}>
                  Change Password
                </Text>
                <Text className="mt-0.5 text-xs font-sans-medium" style={theme.textMuted}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        <Text
          className="mb-3 ml-1 mt-2 text-sm font-sans-bold uppercase tracking-widest"
          style={{ color: `${colors.destructive}B3` }}>
          Danger Zone
        </Text>

        <TouchableOpacity
          onPress={() => setDeleteModal(true)}
          className="mb-10 w-full flex-row items-center justify-between rounded-2xl border p-4 shadow-sm"
          style={{
            backgroundColor: colors.card,
            borderColor: `${colors.destructive}33`,
          }}>
          <View className="flex-row items-center">
            <View
              className="mr-4 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${colors.destructive}1A` }}>
              <Feather name="trash-2" size={20} color={colors.destructive} />
            </View>
            <View>
              <Text className="text-base font-sans-bold" style={{ color: colors.destructive }}>
                Delete Account
              </Text>
              <Text
                className="mt-0.5 text-xs font-sans-medium"
                style={{ color: `${colors.destructive}99` }}>
                Permanently remove your data
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={passwordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModal(false)}>
        {renderModalSheet(
          'Change Password',
          theme.textPrimary,
          <>
            <View className="mb-6 gap-4">
              <TextField
                label="Current Password"
                isPassword
                value={currentPassword}
                error={passwordErrors.currentPassword}
                placeholder="Enter current password"
                onChangeText={(v) => {
                  setCurrentPassword(v);
                  setPasswordErrors((e) => ({ ...e, currentPassword: undefined }));
                }}
              />
              <TextField
                label="New Password"
                isPassword
                value={newPassword}
                error={passwordErrors.newPassword}
                placeholder="At least 6 characters"
                onChangeText={(v) => {
                  setNewPassword(v);
                  setPasswordErrors((e) => ({ ...e, newPassword: undefined }));
                }}
              />
              <TextField
                label="Confirm New Password"
                isPassword
                value={confirmPassword}
                error={passwordErrors.confirmPassword}
                placeholder="Re-enter new password"
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  setPasswordErrors((e) => ({ ...e, confirmPassword: undefined }));
                }}
              />
            </View>

            <View className="flex-row gap-3">
              <Button
                label="Cancel"
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  setPasswordModal(false);
                  resetPasswordForm();
                }}
              />
              <Button
                label="Update"
                className="flex-1"
                loading={isSaving}
                onPress={handleChangePassword}
              />
            </View>
          </>,
          () => setPasswordModal(false)
        )}
      </Modal>

      <Modal
        visible={deleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModal(false)}>
        {renderModalSheet(
          'Delete Account',
          { color: colors.destructive },
          <>
            <Text className="mb-6 text-sm font-sans-medium" style={theme.textMuted}>
              This permanently removes your account and data. This cannot be undone. Enter your
              password to confirm.
            </Text>

            <TextField
              label="Password"
              isPassword
              containerClassName="mb-6"
              value={deletePassword}
              error={deleteErrors.deletePassword}
              placeholder="Enter your password"
              onChangeText={(v) => {
                setDeletePassword(v);
                setDeleteErrors({});
              }}
            />

            <View className="flex-row gap-3">
              <Button
                label="Cancel"
                variant="secondary"
                className="flex-1"
                onPress={() => {
                  setDeleteModal(false);
                  setDeletePassword('');
                  setDeleteErrors({});
                }}
              />
              <Button
                label="Delete"
                variant="danger"
                className="flex-1"
                loading={isSaving}
                onPress={handleDeleteAccount}
              />
            </View>
          </>,
          () => setDeleteModal(false)
        )}
      </Modal>
    </ThemedSafeAreaView>
  );
}
