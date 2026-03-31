import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useUserStore } from "../stores/userStore";
import { COLORS } from "../constants/theme";

export default function Index() {
  const router = useRouter();
  const { session, hasCompletedOnboarding, isLoading } = useUserStore();

  useEffect(() => {
    if (isLoading) return;

    if (!session) {
      router.replace("/(auth)/welcome");
    } else if (!hasCompletedOnboarding) {
      router.replace("/(onboarding)/birth-date");
    } else {
      router.replace("/(tabs)/map");
    }
  }, [session, hasCompletedOnboarding, isLoading]);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: COLORS.background,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ActivityIndicator size="large" color={COLORS.gold} />
    </View>
  );
}
