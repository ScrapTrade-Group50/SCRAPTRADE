import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Mock Data
const MOCK_PURCHASES = [
  { id: '1', date: 'Oct 24, 2023', item: 'High-Carbon Steel Off-cuts', amount: '465 GHS', status: 'IN_ESCROW', factory: 'Suame Industrial Works' },
  { id: '2', date: 'Oct 12, 2023', item: 'Cotton Canvas Fabric Rolls', amount: '90 GHS', status: 'COMPLETED', factory: 'Kumasi Textiles Ltd' },
];

const MOCK_SALES = [
  { id: '3', date: 'Oct 25, 2023', item: 'Hardwood Timber Ends', amount: '180 GHS', status: 'PENDING_PICKUP', buyer: 'Kwame Mensah' },
  { id: '4', date: 'Oct 10, 2023', item: 'Aluminum Sheets', amount: '320 GHS', status: 'COMPLETED', buyer: 'Aba Builders' },
];

export default function TransactionHistory() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');

  const activeData = activeTab === 'purchases' ? MOCK_PURCHASES : MOCK_SALES;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_ESCROW':
      case 'PENDING_PICKUP':
        return (
          <View className="bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
            <Text className="text-xs font-bold text-orange-600">Action Required</Text>
          </View>
        );
      case 'COMPLETED':
        return (
          <View className="bg-green-100 px-3 py-1 rounded-full border border-green-200">
            <Text className="text-xs font-bold text-green-700">Completed</Text>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" style={{ flex: 1 }} edges={['top']}>
      
      {/* HEADER: Navigation & Title */}
      <View className="px-6 py-4 bg-white border-b border-slate-200 z-10 shadow-sm">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
            <Feather name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-slate-900">Ledger</Text>
        </View>

        {/* Custom Segmented Control */}
        <View className="flex-row bg-slate-100 p-1 rounded-xl">
          <TouchableOpacity 
            onPress={() => setActiveTab('purchases')}
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'purchases' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-bold ${activeTab === 'purchases' ? 'text-slate-900' : 'text-slate-500'}`}>
              My Purchases
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setActiveTab('sales')}
            className={`flex-1 py-2.5 items-center rounded-lg ${activeTab === 'sales' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-sm font-bold ${activeTab === 'sales' ? 'text-slate-900' : 'text-slate-500'}`}>
              My Sales
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerClassName="px-6 py-6 pb-12"
        showsVerticalScrollIndicator={false}
      >
        {activeData.map((tx) => (
          <TouchableOpacity 
            key={tx.id} 
            className="bg-white border border-slate-200 rounded-2xl p-5 mb-4 shadow-sm"
          >
            <View className="flex-row justify-between items-start mb-3">
              <Text className="text-sm font-bold text-slate-400">{tx.date}</Text>
              {getStatusBadge(tx.status)}
            </View>
            
            <Text className="text-lg font-bold text-slate-900 mb-1">{tx.item}</Text>
            
            <View className="flex-row items-center mb-4">
              <Feather name={activeTab === 'purchases' ? 'map-pin' : 'user'} size={14} color="#64748b" />
              <Text className="text-sm font-medium text-slate-500 ml-1">
                {activeTab === 'purchases' ? tx.factory : tx.buyer}
              </Text>
            </View>

            <View className="h-px w-full bg-slate-100 mb-4" />

            <View className="flex-row justify-between items-center">
              <Text className="text-sm font-bold text-slate-500">Total Amount</Text>
              <Text className="text-xl font-extrabold text-slate-900">{tx.amount}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Notice for Escrow */}
        <View className="flex-row items-start bg-blue-50 p-4 rounded-xl mt-4 border border-blue-100">
          <Feather name="info" size={20} color="#3b82f6" style={{ marginTop: 2 }} />
          <Text className="text-sm font-medium text-blue-800 ml-3 flex-1">
            {activeTab === 'purchases' 
              ? "Funds for 'Action Required' purchases are safely held in Escrow until you scan your gate pass at the factory."
              : "Funds for 'Action Required' sales will be automatically deposited into your MoMo account once the buyer scans their gate pass."}
          </Text>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}