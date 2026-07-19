import React, { useState, useRef, useCallback } from 'react';
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

const THEME_ACCENT = '#6366f1';

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
  const [permission, requestPermission] = useCameraPermissions();

  const [view, setView] = useState<ScannerView>('camera');
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [noticeDetail, setNoticeDetail] = useState('');
  const [payoutSkipped, setPayoutSkipped] = useState(false);

  const isProcessingRef = useRef(false);

  const resetScanner = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    setManualCode('');
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
          serverMessage ||
            'This code is not recognized, or the order has already been picked up.'
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

  if (!permission) {
    return <View style={styles.loadingRoot} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionRoot} edges={['top', 'bottom']}>
        <View style={styles.permissionBody}>
          <View style={styles.permissionIcon}>
            <Feather name="camera-off" size={32} color={THEME_ACCENT} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionSubtitle}>
            We need your permission to use the camera to scan artisan gate passes.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'verifying') {
    return (
      <SafeAreaView style={styles.resultRoot} edges={['top', 'bottom']}>
        <View style={styles.resultBody}>
          <View style={styles.verifyingIcon}>
            <ActivityIndicator size="large" color={THEME_ACCENT} />
          </View>
          <Text style={styles.resultTitle}>Verifying Pickup…</Text>
          <Text style={styles.resultSubtitle}>
            Confirming this gate pass with the server. The camera is paused until we finish.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'success') {
    return (
      <SafeAreaView style={styles.resultRoot} edges={['top', 'bottom']}>
        <View style={styles.resultBody}>
          <View style={styles.successIcon}>
            <Feather name="check" size={40} color="#ffffff" />
          </View>
          <Text style={styles.resultTitle}>Pickup Verified</Text>
          <Text style={styles.resultSubtitle}>
            {payoutSkipped
              ? 'Pickup confirmed. MoMo payout was skipped (Paystack Starter account). Order marked complete in SCRAPTRADE.'
              : "The artisan's pickup has been confirmed. Escrow funds have been released to your account."}
          </Text>

          <View style={styles.resultCard}>
            <Feather name="shield" size={20} color="#10b981" />
            <Text style={styles.resultCardText}>
              This order is now marked complete. The listing has been updated to Sold.
            </Text>
          </View>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace(ROUTES.factoryDashboard)}>
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={resetScanner}>
            <Text style={styles.secondaryButtonText}>Scan Another Pass</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'wrong_factory') {
    return (
      <SafeAreaView style={styles.resultRoot} edges={['top', 'bottom']}>
        <View style={styles.resultBody}>
          <View style={styles.noticeIcon}>
            <Feather name="info" size={36} color="#b45309" />
          </View>
          <Text style={styles.resultTitle}>Not Your Factory's Order</Text>
          <Text style={styles.resultSubtitle}>{noticeDetail}</Text>

          <View style={styles.noticeCard}>
            <Text style={styles.noticeCardText}>
              Gate passes can only be scanned at the factory that sold the material. Ask the buyer
              to visit the correct pickup location.
            </Text>
          </View>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
            <Text style={styles.primaryButtonText}>Scan Another Code</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (view === 'invalid_code' || view === 'connection_error') {
    const isConnection = view === 'connection_error';
    return (
      <SafeAreaView style={styles.resultRoot} edges={['top', 'bottom']}>
        <View style={styles.resultBody}>
          <View style={[styles.noticeIcon, isConnection && styles.noticeIconMuted]}>
            <Feather
              name={isConnection ? 'wifi-off' : 'alert-circle'}
              size={36}
              color={isConnection ? '#6b7280' : '#6366f1'}
            />
          </View>
          <Text style={styles.resultTitle}>
            {isConnection ? 'Connection Problem' : 'Code Not Accepted'}
          </Text>
          <Text style={styles.resultSubtitle}>{noticeDetail}</Text>
        </View>

        <View style={styles.resultActions}>
          <TouchableOpacity style={styles.primaryButton} onPress={resetScanner}>
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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
              <ActivityIndicator color={THEME_ACCENT} size="small" />
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
                <TouchableOpacity onPress={() => setManualMode(false)} hitSlop={12}>
                  <Text style={styles.manualCancel}>Cancel</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.manualRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="QR-XXXXX"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  value={manualCode}
                  onChangeText={setManualCode}
                  editable={!isProcessing}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    isProcessingRef.current = true;
                    processGatePass(manualCode);
                  }}
                  disabled={isProcessing || manualCode.trim().length < 5}
                  style={[
                    styles.verifyButton,
                    (isProcessing || manualCode.trim().length < 5) && styles.verifyButtonDisabled,
                  ]}>
                  <Text style={styles.verifyButtonText}>Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.hintBlock}>
              <Text style={styles.hintText}>Align the QR code within the frame</Text>
              <TouchableOpacity onPress={() => setManualMode(true)} style={styles.manualLink}>
                <Feather name="edit-2" size={16} color="#ffffff" />
                <Text style={styles.manualLinkText}>Enter Code Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const FRAME = 256;

const styles = StyleSheet.create({
  loadingRoot: { flex: 1, backgroundColor: '#000' },
  cameraRoot: { flex: 1, backgroundColor: '#000' },
  permissionRoot: { flex: 1, backgroundColor: '#f4f7f5' },
  permissionBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  permissionIcon: {
    height: 80,
    width: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(99,102,241,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 22,
    fontFamily: 'sans-bold',
    color: '#0b1f1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  resultRoot: { flex: 1, backgroundColor: '#f4f7f5' },
  resultBody: { flex: 1, paddingHorizontal: 24, paddingTop: 48, alignItems: 'center' },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noticeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noticeIconMuted: { backgroundColor: '#e5e7eb' },
  resultTitle: {
    fontSize: 24,
    fontFamily: 'sans-extrabold',
    color: '#0b1f1a',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultSubtitle: {
    fontSize: 15,
    fontFamily: 'sans-medium',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 16,
    marginTop: 28,
    width: '100%',
  },
  resultCardText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: '#374151',
    lineHeight: 20,
  },
  noticeCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 16,
    marginTop: 28,
    width: '100%',
  },
  noticeCardText: {
    fontSize: 14,
    fontFamily: 'sans-medium',
    color: '#92400e',
    lineHeight: 20,
    textAlign: 'center',
  },
  resultActions: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  primaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#0b1f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: '#ffffff',
  },
  secondaryButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: '#0b1f1a',
  },
  maskTop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  maskBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  maskRow: { flexDirection: 'row', height: FRAME },
  maskSide: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)' },
  frame: {
    width: FRAME,
    height: FRAME,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: THEME_ACCENT,
  },
  corner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff' },
  cornerTL: { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 18 },
  cornerTR: { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 18 },
  cornerBL: { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 18 },
  cornerBR: { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 18 },
  cameraHeader: {
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  verifyingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  verifyingText: { color: '#fff', fontSize: 13, fontFamily: 'sans-bold' },
  cameraFooter: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 12 },
  hintBlock: { alignItems: 'center' },
  hintText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'sans-bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  manualLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  manualLinkText: { color: '#fff', fontSize: 14, fontFamily: 'sans-bold' },
  manualCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
  },
  manualHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  manualTitle: { fontSize: 17, fontFamily: 'sans-bold', color: '#0b1f1a' },
  manualCancel: { fontSize: 14, fontFamily: 'sans-bold', color: '#6b7280' },
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f4f7f5',
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'sans-bold',
    color: '#0b1f1a',
  },
  verifyButton: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#0b1f1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonDisabled: { opacity: 0.45 },
  verifyButtonText: { color: '#fff', fontSize: 15, fontFamily: 'sans-bold' },
});
