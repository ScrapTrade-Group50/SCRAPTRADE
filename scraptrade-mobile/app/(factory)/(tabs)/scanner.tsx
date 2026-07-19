import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useIsFocused } from '@react-navigation/native';
import { apiClient } from '../../api/client';

export default function QRScanner() {
  const router = useRouter();
  const isFocused = useIsFocused(); 
  const [permission, requestPermission] = useCameraPermissions();
  
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualCode, setManualCode] = useState('');

  const isProcessingRef = useRef(false); 

  const THEME_ACCENT = "#6366f1";

  // --- THE AUTO-RESET FIX ---
  // Every time the user navigates TO this screen, completely unlock the scanner
  useEffect(() => {
    if (isFocused) {
      isProcessingRef.current = false;
      setScanned(false);
      setIsProcessing(false);
      setManualCode('');
    }
  }, [isFocused]);

  const processGatePass = async (code: string) => {
    if (!code) return;
    
    setScanned(true); 
    setIsProcessing(true);

    try {
      const response = await apiClient.post(`/orders/verify-pickup?gatePassCode=${code}`);
      
      // FIX 1: Turn off the "Verifying..." UI immediately after success
      setIsProcessing(false);
      
      Alert.alert(
        "Verification Successful! 🎉", 
        "The funds have been released from Escrow to your account.",
        [{ 
          text: "Back to Dashboard", 
          onPress: () => {
            isProcessingRef.current = false;
            router.replace('/(factory)/dashboard');
          } 
        }],
        { cancelable: false } // FIX 2: Prevents tapping outside the alert to bypass the unlock!
      );
    } catch (error: any) {
      console.error('Verification failed:', error);
      
      // Turn off the "Verifying..." UI
      setIsProcessing(false);
      
      Alert.alert(
        "Invalid Code", 
        error.response?.data?.message || "This gate pass could not be verified.",
        [{ 
          text: "Try Again", 
          onPress: () => {
            // Unlock the hardware so they can try scanning again
            isProcessingRef.current = false;
            setScanned(false);
            setManualCode('');
          } 
        }],
        { cancelable: false } // Prevents bypass
      );
    }
  };

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (isProcessingRef.current || scanned) return; 
    
    isProcessingRef.current = true;
    processGatePass(data);
  };

  if (!permission) return <View className="flex-1 bg-background" />;

  if (!permission.granted) {
    return (
      <SafeAreaView className="flex-1 bg-background" style={{ flex: 1 }}>
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-8">
            <View className="h-20 w-20 bg-accent/10 rounded-full items-center justify-center mb-4">
              <Feather name="camera-off" size={32} color={THEME_ACCENT} />
            </View>
            <Text className="text-2xl font-sans-bold text-primary mb-2 text-center">Camera Access Required</Text>
            <Text className="text-base font-sans-medium text-muted-foreground text-center">
              We need your permission to use the camera to scan artisan gate passes.
            </Text>
          </View>
          <TouchableOpacity onPress={requestPermission} className="w-full items-center rounded-xl bg-accent py-4 shadow-sm">
            <Text className="text-base font-sans-bold text-white">Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()} className="mt-8 items-center">
            <Text className="text-sm font-sans-bold text-muted-foreground">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#000' }}>
      
      {isFocused && (
        <CameraView 
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned} // FIX: Removed the dynamic undefined logic
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />
      )}

      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <View className="flex-1 bg-black/60 w-full" />
        <View className="flex-row">
          <View className="flex-1 bg-black/60" />
          <View className="h-64 w-64 border-2 border-accent rounded-2xl bg-transparent relative">
            <View className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1" />
            <View className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1" />
            <View className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1" />
            <View className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1" />
          </View>
          <View className="flex-1 bg-black/60" />
        </View>
        <View className="flex-1 bg-black/60 w-full" />
      </View>

      <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'bottom']} pointerEvents="box-none">
        
        <View className="px-6 py-4 flex-row items-center justify-between" pointerEvents="box-none">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="h-12 w-12 bg-black/50 rounded-full items-center justify-center backdrop-blur-md"
          >
            <Feather name="x" size={24} color="#ffffff" />
          </TouchableOpacity>

          {isProcessing && (
            <View className="bg-black/70 px-4 py-2 rounded-full flex-row items-center backdrop-blur-md">
              <ActivityIndicator color={THEME_ACCENT} size="small" className="mr-2" />
              <Text className="font-sans-bold text-white text-sm">Verifying...</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        <View className="px-6 pb-6 pt-6" pointerEvents="box-none">
          {manualMode ? (
            <View className="bg-card rounded-3xl p-6 shadow-2xl">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-sans-bold text-primary">Enter Code</Text>
                <TouchableOpacity onPress={() => setManualMode(false)}>
                  <Text className="text-sm font-sans-bold text-muted-foreground">Cancel</Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row gap-3">
                <TextInput
                  className="flex-1 bg-background border border-border rounded-xl px-4 h-14 font-sans-bold text-primary text-lg"
                  placeholder="QR-XXXXX"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  value={manualCode}
                  onChangeText={setManualCode}
                  editable={!isProcessing}
                  autoFocus={true}
                />
                <TouchableOpacity 
                  onPress={() => {
                    isProcessingRef.current = true;
                    processGatePass(manualCode);
                  }}
                  disabled={isProcessing || manualCode.length < 5}
                  className={`h-14 px-6 rounded-xl items-center justify-center ${
                    isProcessing || manualCode.length < 5 ? 'bg-primary/50' : 'bg-primary'
                  }`}
                >
                  <Text className="font-sans-bold text-white text-base">Verify</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="items-center">
              <Text className="text-lg font-sans-bold text-white text-center mb-6">
                Align QR Code within the frame to verify pickup
              </Text>
              <TouchableOpacity 
                onPress={() => setManualMode(true)}
                className="bg-black/50 px-6 py-3 rounded-full border border-white/20 backdrop-blur-md flex-row items-center"
              >
                <Feather name="edit-2" size={16} color="#ffffff" className="mr-2" />
                <Text className="font-sans-bold text-white">Enter Code Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}