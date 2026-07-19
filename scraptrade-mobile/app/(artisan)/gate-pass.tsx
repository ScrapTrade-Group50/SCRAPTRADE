import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function GatePass() {
  const router = useRouter();
  
  // We now expect the title, weight, and amount to be passed along with the code!
  const { code, title, weight, amount } = useLocalSearchParams(); 

  const qrString = (code as string) || "QR-ERROR";
  const displayTitle = (title as string) || "Scrap Material";
  const displayWeight = (weight as string) || "--";
  const displayAmount = (amount as string) || "--";

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      
      <ScrollView 
        contentContainerClassName="flex-grow justify-center px-6 py-10"
        showsVerticalScrollIndicator={false}
      >
        
        <View className="items-center mb-8">
          <View className="h-20 w-20 bg-green-100 rounded-full items-center justify-center mb-4 border-4 border-green-50 shadow-sm">
            <Feather name="check" size={40} color="#16a34a" />
          </View>
          <Text className="text-2xl font-sans-extrabold text-primary text-center mb-2">
            Payment Secured!
          </Text>
          <Text className="text-base font-sans-medium text-muted-foreground text-center px-4">
            Your funds are locked in Escrow. Scan this pass at the factory gate.
          </Text>
        </View>

        {/* The Digital Ticket */}
        <View className="bg-card border border-border rounded-3xl shadow-md overflow-hidden relative mb-8">
          
          <View className="bg-primary p-8 items-center justify-center">
            <View className="bg-white p-4 rounded-2xl shadow-sm mb-6">
              <QRCode
                value={qrString}
                size={180}
                color="#0f172a" 
                backgroundColor="#ffffff"
              />
            </View>
            <Text className="text-sm font-sans-bold text-white/70 tracking-widest uppercase mb-1">
              Pickup Code
            </Text>
            <Text className="text-2xl font-sans-extrabold text-white tracking-widest">
              {qrString}
            </Text>
          </View>

          {/* Ticket Divider */}
          <View className="flex-row items-center justify-between absolute top-[320px] w-full z-10 px-0">
            <View className="h-6 w-3 bg-background rounded-r-full border-r border-y border-border" />
            <View className="flex-1 h-px border-t border-dashed border-border opacity-50 mx-2" />
            <View className="h-6 w-3 bg-background rounded-l-full border-l border-y border-border" />
          </View>

          {/* NEW: Receipt Details Section */}
          <View className="p-6 pt-8 bg-card border-b border-border/50">
            <Text className="text-xs font-sans-bold text-muted-foreground uppercase tracking-wider mb-4">Order Summary</Text>
            
            <View className="flex-row justify-between items-start mb-3">
              <View className="flex-1 pr-4">
                <Text className="font-sans-bold text-primary text-base">{displayTitle}</Text>
                <Text className="font-sans-medium text-muted-foreground text-sm mt-1">{displayWeight} kg</Text>
              </View>
              <Text className="font-sans-bold text-primary text-base">
                GHS {Number(displayAmount).toFixed(2)}
              </Text>
            </View>
          </View>

          <View className="p-6 bg-card">
            <View className="flex-row items-center">
              <View className="h-10 w-10 bg-accent/10 rounded-full items-center justify-center mr-3">
                <Feather name="alert-circle" size={20} color="#ea7a53" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-sans-bold text-primary">Do not share this code</Text>
                <Text className="text-xs font-sans-medium text-muted-foreground mt-0.5">
                  Anyone with this code can claim your materials.
                </Text>
              </View>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={() => router.replace('/(artisan)/feed')}
          className="w-full items-center justify-center rounded-2xl bg-muted h-16 border border-border"
        >
          <Text className="text-lg font-sans-bold text-primary">Return to Marketplace</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}