import { Slot } from "expo-router";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppHeader } from "../../components/ui/AppHeader";
import { PALETTE } from "../../constants/designSystem";

export default function TabsLayout() {
  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: PALETTE.background }}
    >
      <AppHeader showRibbon />
      <View style={{ flex: 1, backgroundColor: PALETTE.background }}>
        <Slot />
      </View>
    </SafeAreaView>
  );
}
