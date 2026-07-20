import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { apiClient } from '@/api/client';
import { ROUTES } from '@/utils/routes';
import ThemedSafeAreaView from '@/components/ThemedSafeAreaView';
import { useScreenTheme } from '@/hooks/useScreenTheme';
import type { ThemeColors } from '@/constants/theme';
import { Button } from '@/components/ui';

const FRAME = 256;

function sanitizeErrorMessage(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.includes('"message"') && raw.includes('"status"')) {
    const match = raw.match(/"message"\s*:\s*"([^"]+)"/);
    if (match?.[1]) return match[1];
  }
  if (raw.startsWith('400 Bad Request:') || raw.startsWith('409 Conflict:')) {
    const jsonStart = raw.indexOf('{');
    if (jsonStart >= 0) {
      const match = raw.slice(jsonStart).match(/"message"\s*:\s*"([^"]+)"/);
      if (match?.[1]) return match[1];
    }
  }
  return raw;
}

function validateGatePassCode(value: string): string | null {
  const code = value.trim().toUpperCase();
  if (!code) return 'Enter a gate pass code.';
  if (code.length < 5) return 'Code must be at least 5 characters.';
  if (code.length > 64) return 'Code is too long.';
  if (!/^[A-Z0-9\-]+$/.test(code)) return 'Use letters, numbers, and hyphens only.';
  return null;
}

type ScannerView =
  | 'camera'
  | 'verifying'
  | 'success'
  | 'wrong_factory'
  | 'invalid_code'
  | 'connection_error';

export default function QRScanner() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const theme = useScreenTheme();
  const { colors } = theme;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();

  const [view, setView] = useState<ScannerView>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [noticeDetail, setNoticeDetail] = useState('');
  const [payoutSkipped, setPayoutSkipped] = useState(false);

  const isProcessingRef = useRef(false);

  const resetScanner = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    setManualCode('');
    setManualError(null);
    setManualMode(false);
    setNoticeDetail('');
    setPayoutSkipped(false);
    setView('camera');
  }, []);

  const processGatePass = async (code: string) => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) return;

    setView('verifying');
    setIsProcessing(true);

    try {
      const response = await apiClient.post(
        `/orders/verify-pickup?gatePassCode=${encodeURIComponent(normalized)}`
      );
      setPayoutSkipped(Boolean(response.data?.payoutSkipped));
      setView('success');
    } catch (error: any) {
      const status = error.response?.status;
      const serverMessage = sanitizeErrorMessage(error.response?.data?.message as string | undefined);

      if (status === 403) {
        setNoticeDetail(
          serverMessage ||
            'This gate pass belongs to another factory. You can only verify pickups for orders on your own listings.'
        );
        setView('wrong_factory');
      } else if (status === 400 || status === 409) {
        setNoticeDetail(
          serverMessage || 'This code is not recognized, or the order has already been picked up.'
        );
        setView('invalid_code');
      } else if (!error.response) {
        setNoticeDetail('Could not reach the server. Check your connection and try again.');
        setView('connection_error');
      } else {
        setNoticeDetail(serverMessage || 'This gate pass could not be verified.');
        setView('invalid_code');
      }

      const isExpectedFailure = status === 403 || status === 400 || status === 409 || !error.response;
      if (!isExpectedFailure) {
        console.error('Verification failed:', error);
      }
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleBarcodeScanned = ({ data }: { type: string; data: string }) => {
    if (isProcessingRef.current || view !== 'camera') return;
    isProcessingRef.current = true;
    processGatePass(data);
  };

  const submitManualCode = () => {
    const err = validateGatePassCode(manualCode);
    if (err) {
      setManualError(err);
      return;
    }
    setManualError(null);
    isProcessingRef.current = true;
    processGatePass(manualCode);
  };

  if (!permission) {
    return <View style={styles.loadingRoot} />;
  }

  if (!permission.granted) {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 justify-center px-6">
          <View
            className="mb-4 h-20 w-20 items-center justify-center self-center rounded-full"
            style={theme.accentSoft}>
            <Feather name="camera-off" size={32} color={colors.accent} />
          </View>
          <Text className="mb-2 text-center text-2xl font-sans-bold" style={theme.textPrimary}>
            Camera Access Required
          </Text>
          <Text className="mb-8 text-center text-base font-sans-medium" style={theme.textMuted}>
            We need your permission to use the camera to scan artisan gate passes.
          </Text>
          <Button label="Grant Permission" onPress={requestPermission} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'verifying') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center px-6 pt-12">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-full"
            style={theme.accentSoft}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
          <Text className="mb-2 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Verifying Pickup…
          </Text>
          <Text className="text-center text-base font-sans-medium" style={theme.textMuted}>
            Confirming this gate pass with the server. The camera is paused until we finish.
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'success') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center px-6 pt-12">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.success }}>
            <Feather name="check" size={40} color={colors.onAccent} />
          </View>
          <Text className="mb-2 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Pickup Verified
          </Text>
          <Text className="mb-6 text-center text-base font-sans-medium" style={theme.textMuted}>
            {payoutSkipped
              ? 'Pickup confirmed. MoMo payout was skipped (Paystack Starter account). Order marked complete in SCRAPTRADE.'
              : "The artisan's pickup has been confirmed. Escrow funds have been released to your account."}
          </Text>
          <View className="w-full flex-row gap-3 rounded-2xl border p-4" style={theme.card}>
            <Feather name="shield" size={20} color={colors.success} />
            <Text className="flex-1 text-sm font-sans-medium leading-5" style={theme.textPrimary}>
              This order is now marked complete. The listing has been updated to Sold.
            </Text>
          </View>
        </View>
        <View className="gap-3 px-6 pb-8">
          <Button
            label="Back to Dashboard"
            onPress={() => router.replace(ROUTES.factoryDashboard)}
          />
          <Button label="Scan Another Pass" variant="secondary" onPress={resetScanner} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'wrong_factory') {
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center px-6 pt-12">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-full"
            style={theme.cardMuted}>
            <Feather name="info" size={36} color={colors.mutedForeground} />
          </View>
          <Text className="mb-2 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            Not Your Factory's Order
          </Text>
          <Text className="mb-6 text-center text-base font-sans-medium" style={theme.textMuted}>
            {noticeDetail}
          </Text>
          <View className="w-full rounded-2xl border p-4" style={theme.card}>
            <Text className="text-center text-sm font-sans-medium leading-5" style={theme.textMuted}>
              Gate passes can only be scanned at the factory that sold the material. Ask the buyer
              to visit the correct pickup location.
            </Text>
          </View>
        </View>
        <View className="px-6 pb-8">
          <Button label="Scan Another Code" onPress={resetScanner} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (view === 'invalid_code' || view === 'connection_error') {
    const isConnection = view === 'connection_error';
    return (
      <ThemedSafeAreaView edges={['top', 'bottom']}>
        <View className="flex-1 items-center px-6 pt-12">
          <View
            className="mb-5 h-20 w-20 items-center justify-center rounded-full"
            style={theme.cardMuted}>
            <Feather
              name={isConnection ? 'wifi-off' : 'alert-circle'}
              size={36}
              color={isConnection ? colors.mutedForeground : colors.accent}
            />
          </View>
          <Text className="mb-2 text-center text-2xl font-sans-extrabold" style={theme.textPrimary}>
            {isConnection ? 'Connection Problem' : 'Code Not Accepted'}
          </Text>
          <Text className="text-center text-base font-sans-medium" style={theme.textMuted}>
            {noticeDetail}
          </Text>
        </View>
        <View className="px-6 pb-8">
          <Button label="Try Again" onPress={resetScanner} />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.cameraRoot}>
      {isFocused && view === 'camera' && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={isProcessing ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />
      )}

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View style={styles.maskTop} />
        <View style={styles.maskRow}>
          <View style={styles.maskSide} />
          <View style={styles.frame}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.maskSide} />
        </View>
        <View style={styles.maskBottom} />
      </View>

      <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.cameraHeader} pointerEvents="box-none">
          {isProcessing && (
            <View style={styles.verifyingBadge}>
              <ActivityIndicator color={colors.accent} size="small" />
              <Text style={styles.verifyingText}>Verifying…</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        <View style={styles.cameraFooter} pointerEvents="box-none">
          {manualMode ? (
            <View style={styles.manualCard}>
              <View style={styles.manualHeader}>
                <Text style={styles.manualTitle}>Enter Code</Text>
                <TouchableOpacity
                  onPress={() => {
                    setManualMode(false);
                    setManualError(null);
                  }}
                  hitSlop={12}>
                  <Text style={styles.manualCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.manualRow}>
                <TextInput
                  style={[styles.manualInput, manualError ? styles.manualInputError : null]}
                  placeholder="QR-XXXXX"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="characters"
                  value={manualCode}
                  onChangeText={(v) => {
                    setManualCode(v);
                    setManualError(null);
                  }}
                  editable={!isProcessing}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={submitManualCode}
                  disabled={isProcessing}
                  style={[styles.verifyButton, isProcessing && styles.verifyButtonDisabled]}>
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
              {manualError ? <Text style={styles.manualErrorText}>{manualError}</Text> : null}
            </View>
          ) : (
            <View style={styles.hintBlock}>
              <Text style={styles.hintText}>Align the QR code within the frame</Text>
              <TouchableOpacity onPress={() => setManualMode(true)} style={styles.manualLink}>
                <Feather name="edit-2" size={16} color="#F8FAFC" />
                <Text style={styles.manualLinkText}>Enter Code Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loadingRoot: { flex: 1, backgroundColor: colors.inverse },
    cameraRoot: { flex: 1, backgroundColor: colors.inverse },
    maskTop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)' },
    maskBottom: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)' },
    maskRow: { flexDirection: 'row', height: FRAME },
    maskSide: { flex: 1, backgroundColor: 'rgba(15,23,42,0.7)' },
    frame: {
      width: FRAME,
      height: FRAME,
      borderRadius: 20,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    corner: { position: 'absolute', width: 28, height: 28, borderColor: '#F8FAFC' },
    cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
    cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
    cornerBL: {
      bottom: -2,
      left: -2,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: 18,
    },
    cornerBR: {
      bottom: -2,
      right: -2,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: 18,
    },
    cameraHeader: {
      paddingHorizontal: 20,
      paddingTop: 12,
      alignItems: 'center',
    },
    verifyingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(15,23,42,0.75)',
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
    },
    verifyingText: { color: '#F8FAFC', fontSize: 13, fontFamily: 'sans-bold' },
    cameraFooter: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 },
    hintBlock: { alignItems: 'center' },
    hintText: {
      color: '#F8FAFC',
      fontSize: 16,
      fontFamily: 'sans-bold',
      textAlign: 'center',
      marginBottom: 16,
    },
    manualLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(15,23,42,0.55)',
      borderWidth: 1,
      borderColor: 'rgba(248,250,252,0.2)',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 999,
    },
    manualLinkText: { color: '#F8FAFC', fontSize: 14, fontFamily: 'sans-bold' },
    manualCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    manualHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    manualTitle: { fontSize: 17, fontFamily: 'sans-bold', color: colors.primary },
    manualCancel: { fontSize: 14, fontFamily: 'sans-bold', color: colors.mutedForeground },
    manualRow: { flexDirection: 'row', gap: 10 },
    manualInput: {
      flex: 1,
      height: 52,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
      fontSize: 16,
      fontFamily: 'sans-bold',
      color: colors.primary,
    },
    manualInputError: {
      borderColor: colors.destructive,
      backgroundColor: `${colors.destructive}14`,
    },
    manualErrorText: {
      marginTop: 8,
      fontSize: 13,
      fontFamily: 'sans-medium',
      color: colors.destructive,
    },
    verifyButton: {
      height: 52,
      paddingHorizontal: 20,
      borderRadius: 12,
      backgroundColor: colors.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifyButtonDisabled: { opacity: 0.45 },
    verifyButtonText: { color: colors.onAccent, fontSize: 15, fontFamily: 'sans-bold' },
  });
}
