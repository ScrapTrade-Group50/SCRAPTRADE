import { Text, TouchableOpacity, ScrollView } from 'react-native';
import { Link } from 'expo-router';

export default function Home() {
  return (
    <ScrollView
      className="bg-background flex-1"
      contentContainerClassName="items-center px-6 py-16 pb-20"
      showsVerticalScrollIndicator={false}>
      <Text className="text-primary font-sans-extrabold mb-2 text-3xl">SCRAPTRADE</Text>
      <Text className="text-muted-foreground font-sans-medium mb-8 text-sm">
        Developer Navigation Hub
      </Text>

      {/* Remove (auth) from the path */}
      <Link href="/sign-in" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4">
          <Text className="font-sans-bold text-lg text-white">Test Sign In</Text>
        </TouchableOpacity>
      </Link>

      {/* Remove (auth) from the path */}
      <Link href="/sign-up" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4">
          <Text className="font-sans-bold text-lg text-white">Test Sign Up</Text>
        </TouchableOpacity>
      </Link>

      {/* Remove (artisan) from the path */}
      <Link href="/feed" asChild>
        <TouchableOpacity className="bg-primary mt-8 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Artisan Feed</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/dashboard" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Factory Dashboard</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/scanner" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test QR Scanner</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/listing-detail" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Listing Detail</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/checkout" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test MoMo Checkout</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/gate-pass" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Gate Pass (QR)</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/profile" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Profile & Settings</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/transactions" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Transaction History</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/notifications" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Notifications</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/forgot-password" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Forgot Password</Text>
        </TouchableOpacity>
      </Link>

      <Link href="/edit-listing" asChild>
        <TouchableOpacity className="bg-primary mt-4 w-full items-center rounded-2xl p-4 shadow-sm">
          <Text className="font-sans-bold text-lg text-white">Test Edit Listing</Text>
        </TouchableOpacity>
      </Link>
    </ScrollView>
  );
}