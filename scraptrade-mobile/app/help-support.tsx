import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function HelpSupport() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      
      {/* Header */}
      <View className="flex-row items-center px-6 py-4 bg-background border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1">
          <Feather name="arrow-left" size={24} color="#0b1f1a" />
        </TouchableOpacity>
        <Text className="text-xl font-sans-bold text-primary">Help & Support</Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        
        {/* Intro Text */}
        <Text className="text-2xl font-sans-extrabold text-primary mb-2">How can we help?</Text>
        <Text className="text-base font-sans-medium text-muted-foreground mb-8">
          Our team is available Monday through Saturday, 8am to 6pm GMT to assist with your trades.
        </Text>

        {/* Contact Cards Grid */}
        <View className="flex-row justify-between mb-8">
          {/* WhatsApp Button */}
          <TouchableOpacity className="flex-1 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl p-5 items-center mr-2 shadow-sm">
            <FontAwesome5 name="whatsapp" size={28} color="#25D366" className="mb-3" />
            <Text className="text-sm font-sans-bold text-primary">Chat</Text>
            <Text className="text-xs font-sans-medium text-muted-foreground text-center mt-1">Quick replies</Text>
          </TouchableOpacity>

          {/* Email Button */}
          <TouchableOpacity className="flex-1 bg-accent/10 border border-accent/20 rounded-2xl p-5 items-center ml-2 shadow-sm">
            <Feather name="mail" size={28} color="#6366f1" className="mb-3" />
            <Text className="text-sm font-sans-bold text-primary">Email</Text>
            <Text className="text-xs font-sans-medium text-muted-foreground text-center mt-1">support@</Text>
          </TouchableOpacity>
        </View>

        {/* Phone Support */}
        <TouchableOpacity className="w-full flex-row items-center justify-between bg-card border border-border rounded-2xl p-4 mb-10 shadow-sm">
          <View className="flex-row items-center">
            <View className="h-12 w-12 bg-background rounded-full items-center justify-center mr-4 border border-border">
              <Feather name="phone-call" size={20} color="#0b1f1a" />
            </View>
            <View>
              <Text className="text-base font-sans-bold text-primary">Call Support Line</Text>
              <Text className="text-sm font-sans-medium text-muted-foreground mt-0.5">030 212 3456</Text>
            </View>
          </View>
          <View className="bg-accent px-4 py-2 rounded-full">
            <Text className="text-xs font-sans-bold text-white">CALL</Text>
          </View>
        </TouchableOpacity>

        {/* FAQ Section */}
        <Text className="text-sm font-sans-bold text-muted-foreground uppercase tracking-widest mb-4 ml-1">
          Frequently Asked Questions
        </Text>
        
        <View className="bg-card border border-border rounded-2xl mb-12 overflow-hidden shadow-sm">
          {['How does Escrow work?', 'How long do pickups take?', 'What if the scrap weight is wrong?'].map((q, index) => (
            <TouchableOpacity 
              key={index} 
              className={`flex-row items-center justify-between p-4 ${index !== 2 ? 'border-b border-border' : ''}`}
            >
              <Text className="text-sm font-sans-bold text-primary flex-1 pr-4">{q}</Text>
              <Feather name="chevron-down" size={20} color="#6b7280" />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}