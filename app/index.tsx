import { Redirect } from "expo-router";
import { useUserStore } from "../stores/userStore";

export default function Index() {
  const hasCompletedOnboarding = useUserStore((s) => s.hasCompletedOnboarding);
  return (
    <Redirect href={hasCompletedOnboarding ? "/(tabs)/map" : "/welcome"} />
  );
}
