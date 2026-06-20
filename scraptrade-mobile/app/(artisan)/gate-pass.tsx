import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, Link } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function GatePass() {
  const router = useRouter();

  // The data embedded in the QR code (this will match what the factory scanner reads)
  const orderId = "ORD-9876-METAL";

  return (
    <SafeAreaView className="flex-1 bg-slate-50" style={{ flex: 1 }} edges={['top']}>
      
      {/* 1. Header: Success Banner */}
      <View className="bg-green-600 px-6 py-8 items-center justify-center rounded-b-3xl shadow-sm z-10">
        <View className="h-16 w-16 bg-white rounded-full items-center justify-center mb-3">
          <Feather name="check" size={32} color="#16a34a" />
        </View>
        <Text className="text-2xl font-extrabold text-white">Payment Successful!</Text>
        <Text className="text-green-100 font-medium mt-1 text-center">
          Funds are held securely in Escrow.
        </Text>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerClassName="px-6 pt-10 pb-10 items-center"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        
        {/* 2. Body: Massive QR Code */}
        <View className="bg-white p-8 rounded-3xl border-2 border-slate-200 shadow-sm items-center w-full mb-8">
          <Text className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
            Digital Gate Pass
          </Text>
          
          <QRCode
            value={orderId}
            size={220}
            color="#0f172a"
            backgroundColor="#ffffff"
          />

          <Text className="text-lg font-bold text-slate-900 mt-6 tracking-widest">
            {orderId}
          </Text>
        </View>

        {/* 3. Pickup Details */}
        <View className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-8">
          <View className="flex-row items-center mb-4">
            <Feather name="map-pin" size={20} color="#ea580c" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Pickup Location</Text>
          </View>
          
          <Text className="text-base font-bold text-slate-800">Suame Industrial Works</Text>
          <Text className="text-base font-medium text-slate-500 mt-1">
            Plot 45, Magazine Road{"\n"}Kumasi, Ashanti Region
          </Text>

          <View className="h-px w-full bg-slate-200 my-4" />

          <View className="flex-row items-center mb-2">
            <Feather name="calendar" size={20} color="#ea580c" />
            <Text className="text-lg font-bold text-slate-900 ml-2">Available From</Text>
          </View>
          <Text className="text-base font-bold text-slate-800">Today, anytime before 5:00 PM</Text>
        </View>

        {/* Action: Return to Feed */}
        <Link href="/feed" asChild>
          <TouchableOpacity className="w-full items-center rounded-xl bg-slate-900 py-4 shadow-sm">
            <Text className="text-base font-bold text-white">Back to Market Feed</Text>
          </TouchableOpacity>
        </Link>

      </ScrollView>
    </SafeAreaView>
  );
}