import React from "react";
import { View, Text, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Calendar,
  Clock,
  MapPin,
  LogOut,
  Crown,
  ChevronRight,
  Sparkles,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, setSession, setHasCompletedOnboarding } =
    useUserStore();

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          setHasCompletedOnboarding(false);
          router.replace("/(auth)/welcome");
        },
      },
    ]);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(timeStr: string | null, unknown: boolean): string {
    if (unknown || !timeStr) return "Unknown (using noon default)";
    const [h, m] = timeStr.split(":");
    const hour = parseInt(h);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${period}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <ScrollView className="flex-1 px-4 py-4">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-full bg-surface items-center justify-center mb-3 border-2 border-gold/30">
            <User color={COLORS.gold} size={32} />
          </View>
          <Text className="text-cream font-inter-bold text-xl">
            Your Profile
          </Text>
          {user?.subscriptionTier === "premium" && (
            <View className="flex-row items-center gap-1 mt-1">
              <Crown color={COLORS.gold} size={14} />
              <Text className="text-gold font-inter-medium text-xs">
                Premium Member
              </Text>
            </View>
          )}
        </View>

        {/* Birth Info */}
        <View className="bg-surface rounded-2xl p-4 mb-4">
          <Text className="text-cream-muted font-inter-medium text-xs uppercase tracking-wider mb-3">
            Birth Information
          </Text>

          <View className="gap-4">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-background items-center justify-center">
                <Calendar color={COLORS.gold} size={16} />
              </View>
              <View>
                <Text className="text-cream-muted font-inter text-xs">
                  Date
                </Text>
                <Text className="text-cream font-inter-medium">
                  {user ? formatDate(user.birthDate) : "—"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-background items-center justify-center">
                <Clock color={COLORS.gold} size={16} />
              </View>
              <View>
                <Text className="text-cream-muted font-inter text-xs">
                  Time
                </Text>
                <Text className="text-cream font-inter-medium">
                  {user
                    ? formatTime(user.birthTime, user.birthTimeUnknown)
                    : "—"}
                </Text>
              </View>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-background items-center justify-center">
                <MapPin color={COLORS.gold} size={16} />
              </View>
              <View>
                <Text className="text-cream-muted font-inter text-xs">
                  Location
                </Text>
                <Text className="text-cream font-inter-medium">
                  {user?.birthCity ?? "—"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Subscription */}
        {user?.subscriptionTier === "free" && (
          <TouchableOpacity className="bg-gradient-to-r from-purple to-gold rounded-2xl p-4 mb-4 border border-gold/30 bg-surface">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-gold/20 items-center justify-center">
                  <Sparkles color={COLORS.gold} size={18} />
                </View>
                <View>
                  <Text className="text-cream font-inter-bold text-base">
                    Upgrade to Premium
                  </Text>
                  <Text className="text-cream-muted font-inter text-xs">
                    Unlock all readings and features
                  </Text>
                </View>
              </View>
              <ChevronRight color={COLORS.gold} size={18} />
            </View>
          </TouchableOpacity>
        )}

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row items-center justify-center gap-2 py-4 mt-4"
        >
          <LogOut color={COLORS.danger} size={18} />
          <Text className="text-danger font-inter-medium">Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
