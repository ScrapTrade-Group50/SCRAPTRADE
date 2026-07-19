import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../api/client';
import { showAlert } from '../utils/alert';
import { useAuthStore } from '../store/authStore';

export default function PrivacySecurity() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  const [passwordModal, setPasswordModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showAlert('Required', 'Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Too Short', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New passwords do not match.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      setPasswordModal(false);
      resetPasswordForm();
      showAlert('Success', 'Your password has been changed.');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not change password.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      showAlert('Required', 'Please enter your password to confirm.');
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.delete('/auth/me', { data: { password: deletePassword } });
      setDeleteModal(false);
      setDeletePassword('');
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error: any) {
      showAlert('Error', error.response?.data?.message || 'Could not delete account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }} edges={['top']}>
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Privacy & Security</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-3 ml-1">
          Login & Security
        </Text>

        <View className="bg-card border border-border rounded-2xl mb-8 shadow-sm overflow-hidden">
          <TouchableOpacity
            onPress={() => setPasswordModal(true)}
            className="flex-row items-center justify-between p-4">
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-background rounded-full items-center justify-center mr-4 border border-border">
                <Feather name="lock" size={20} color="#0b1f1a" />
              </View>
              <View>
                <Text className="text-base font-sans-bold text-primary">Change Password</Text>
                <Text className="text-xs font-sans-medium text-muted-foreground mt-0.5">
                  Update your account password
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <Text className="text-sm font-sans-bold text-red-500/70 uppercase tracking-widest mb-3 ml-1 mt-2">
          Danger Zone
        </Text>

        <TouchableOpacity
          onPress={() => setDeleteModal(true)}
          className="w-full flex-row items-center justify-between bg-card border border-red-100 rounded-2xl p-4 mb-10 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-10 w-10 bg-red-50 rounded-full items-center justify-center mr-4">
              <Feather name="trash-2" size={20} color="#ef4444" />
            </View>
            <View>
              <Text className="text-base font-sans-bold text-red-600">Delete Account</Text>
              <Text className="text-xs font-sans-medium text-red-400 mt-0.5">
                Permanently remove your data
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#fca5a5" />
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPasswordModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-[32px] px-6 pt-4 pb-10">
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 bg-border rounded-full" />
            </View>
            <Text className="text-xl font-sans-bold text-primary mb-6">Change Password</Text>

            <View className="gap-2 mb-4">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Current Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
                placeholder="Enter current password"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View className="gap-2 mb-4">
              <Text className="text-sm font-sans-semibold text-primary ml-1">New Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                placeholder="At least 6 characters"
                placeholderTextColor="#94a3b8"
              />
            </View>
            <View className="gap-2 mb-6">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Confirm New Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholder="Re-enter new password"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setPasswordModal(false);
                  resetPasswordForm();
                }}
                className="flex-1 items-center justify-center rounded-xl bg-muted py-4 border border-border">
                <Text className="text-base font-sans-bold text-primary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                disabled={isSaving}
                className="flex-1 items-center justify-center rounded-xl bg-accent py-4">
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        visible={deleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setDeleteModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-[32px] px-6 pt-4 pb-10">
            <View className="items-center pb-2">
              <View className="w-12 h-1.5 bg-border rounded-full" />
            </View>
            <Text className="text-xl font-sans-bold text-red-600 mb-2">Delete Account</Text>
            <Text className="text-sm font-sans-medium text-muted-foreground mb-6">
              This permanently removes your account and data. This cannot be undone. Enter your
              password to confirm.
            </Text>

            <View className="gap-2 mb-6">
              <Text className="text-sm font-sans-semibold text-primary ml-1">Password</Text>
              <TextInput
                className="rounded-xl border border-border bg-card px-4 py-4 text-base font-sans-medium text-primary"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => {
                  setDeleteModal(false);
                  setDeletePassword('');
                }}
                className="flex-1 items-center justify-center rounded-xl bg-muted py-4 border border-border">
                <Text className="text-base font-sans-bold text-primary">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={isSaving}
                className="flex-1 items-center justify-center rounded-xl bg-red-500 py-4">
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text className="text-base font-sans-bold text-white">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
