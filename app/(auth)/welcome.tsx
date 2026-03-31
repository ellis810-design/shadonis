import React from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Star } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { COLORS } from "../../constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View className="flex-1 px-6 justify-between py-8">
        {/* Top decorative area */}
        <View className="flex-1 items-center justify-center">
          <View className="items-center mb-4">
            <View className="w-24 h-24 rounded-full bg-surface items-center justify-center mb-6 border-2 border-gold/30">
              <Sparkles color={COLORS.gold} size={40} />
            </View>

            <Text className="text-cream font-inter-bold text-4xl mb-2 text-center">
              Shadonis
            </Text>
            <Text className="text-gold font-inter-medium text-lg mb-8 text-center">
              Your celestial compass
            </Text>
          </View>

          <View className="bg-surface/50 rounded-2xl p-6 w-full">
            <Text className="text-cream text-center font-inter text-base leading-6">
              Discover how the stars align with your path across the globe.
              Explore your personal astrocartography map and find the places
              where your energy resonates most.
            </Text>
          </View>

          {/* Decorative stars */}
          <View className="flex-row items-center justify-center mt-8 gap-6 opacity-40">
            <Star color={COLORS.gold} size={12} fill={COLORS.gold} />
            <Star color={COLORS.purple} size={8} fill={COLORS.purple} />
            <Star color={COLORS.gold} size={16} fill={COLORS.gold} />
            <Star color={COLORS.purple} size={8} fill={COLORS.purple} />
            <Star color={COLORS.gold} size={12} fill={COLORS.gold} />
          </View>
        </View>

        {/* Bottom CTA */}
        <View className="gap-3">
          <Button
            title="Get Started"
            onPress={() => router.push("/(auth)/login")}
          />
          <Button
            title="I already have an account"
            variant="ghost"
            onPress={() => router.push("/(auth)/login")}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
