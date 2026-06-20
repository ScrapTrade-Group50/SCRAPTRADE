import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function QRScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  // Your global theme accent color
  const THEME_ACCENT = "#6366f1";

  // 1. Handle Loading State
  if (!permission) {
    return <View className="flex-1 bg-background" />;
  }

  // 2. Handle Camera Permission Denied (Padding fixed!)
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
          
          <TouchableOpacity 
            onPress={requestPermission}
            className="w-full items-center rounded-xl bg-accent py-4 shadow-sm"
          >
            <Text className="text-base font-sans-bold text-white">Grant Permission</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.back()} className="mt-8 items-center">
            <Text className="text-sm font-sans-bold text-muted-foreground">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 3. Handle Successful Scan
  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    Alert.alert(
      "Gate Pass Verified!", 
      `Order Data: ${data}`,
      [{ text: "OK", onPress: () => setScanned(false) }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* FULL SCREEN CAMERA */}
      <CameraView 
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
      />

      {/* OVERLAY MASK: Darkens everything EXCEPT the center square */}
      <View style={StyleSheet.absoluteFillObject}>
        {/* Top Dark Block */}
        <View className="flex-1 bg-black/60 w-full" />
        
        {/* Middle Row with Cutout */}
        <View className="flex-row">
          {/* Left Dark Block */}
          <View className="flex-1 bg-black/60" />
          
          {/* THE CLEAR CUTOUT */}
          <View className="h-64 w-64 border-2 border-accent rounded-2xl bg-transparent relative">
            {/* Corner Accents */}
            <View className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-white rounded-tl-2xl -mt-1 -ml-1" />
            <View className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-white rounded-tr-2xl -mt-1 -mr-1" />
            <View className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-white rounded-bl-2xl -mb-1 -ml-1" />
            <View className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-white rounded-br-2xl -mb-1 -mr-1" />
          </View>
          
          {/* Right Dark Block */}
          <View className="flex-1 bg-black/60" />
        </View>

        {/* Bottom Dark Block */}
        <View className="flex-1 bg-black/60 w-full" />
      </View>

      {/* UI ELEMENTS (Safe Area on top of everything) */}
      <SafeAreaView style={StyleSheet.absoluteFillObject} edges={['top', 'bottom']} pointerEvents="box-none">
        
        {/* Header: Back Button */}
        <View className="px-6 py-4 flex-row items-center" pointerEvents="box-none">
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="h-12 w-12 bg-black/50 rounded-full items-center justify-center"
          >
            <Feather name="x" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Footer: Instructions */}
        <View className="mt-auto px-8 pb-10 pt-6 items-center justify-center" pointerEvents="box-none">
          <Text className="text-lg font-sans-bold text-white text-center">
            Align QR Code within the frame to verify pickup
          </Text>
        </View>

      </SafeAreaView>
    </View>
  );
}