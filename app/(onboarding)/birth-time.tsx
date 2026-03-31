import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Clock, ArrowLeft, Info } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";

function TimeWheel({
  value,
  options,
  onChange,
  label,
}: {
  value: number | string;
  options: { label: string; value: number | string }[];
  onChange: (val: number | string) => void;
  label: string;
}) {
  const currentIndex = options.findIndex((o) => o.value === value);

  return (
    <View className="flex-1 items-center">
      <Text className="text-cream-muted text-xs font-inter-medium mb-3 uppercase tracking-wider">
        {label}
      </Text>
      <View className="bg-surface rounded-2xl py-2 w-full items-center">
        <Text
          className="text-cream-muted/30 text-lg font-inter py-2"
          onPress={() => {
            if (currentIndex > 0) onChange(options[currentIndex - 1].value);
          }}
        >
          {currentIndex > 0 ? options[currentIndex - 1].label : ""}
        </Text>

        <View className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 w-full items-center">
          <Text className="text-gold text-2xl font-inter-bold">
            {options[currentIndex]?.label ?? ""}
          </Text>
        </View>

        <Text
          className="text-cream-muted/30 text-lg font-inter py-2"
          onPress={() => {
            if (currentIndex < options.length - 1)
              onChange(options[currentIndex + 1].value);
          }}
        >
          {currentIndex < options.length - 1
            ? options[currentIndex + 1].label
            : ""}
        </Text>
      </View>
    </View>
  );
}

export default function BirthTimeScreen() {
  const router = useRouter();
  const { updateOnboarding, onboarding } = useUserStore();

  const existing = onboarding.birthTime;
  const [hour, setHour] = useState(existing ? existing.getHours() % 12 || 12 : 12);
  const [minute, setMinute] = useState(existing ? existing.getMinutes() : 0);
  const [period, setPeriod] = useState<"AM" | "PM">(
    existing && existing.getHours() >= 12 ? "PM" : "PM"
  );
  const [unknownTime, setUnknownTime] = useState(onboarding.birthTimeUnknown);

  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const minuteOptions = Array.from({ length: 60 }, (_, i) => ({
    label: String(i).padStart(2, "0"),
    value: i,
  }));
  const periodOptions = [
    { label: "AM", value: "AM" },
    { label: "PM", value: "PM" },
  ];

  function handleNext() {
    if (unknownTime) {
      const noon = new Date();
      noon.setHours(12, 0, 0, 0);
      updateOnboarding({
        birthTime: noon,
        birthTimeUnknown: true,
      });
    } else {
      const time = new Date();
      let h = hour;
      if (period === "PM" && h !== 12) h += 12;
      if (period === "AM" && h === 12) h = 0;
      time.setHours(h, minute, 0, 0);
      updateOnboarding({
        birthTime: time,
        birthTimeUnknown: false,
      });
    }
    router.push("/(onboarding)/birth-location");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View className="flex-1 px-6 py-4 justify-between">
        <View>
          <ProgressBar currentStep={2} totalSteps={3} />

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 items-center justify-center rounded-full bg-surface mt-4 mb-4"
          >
            <ArrowLeft color={COLORS.cream} size={20} />
          </TouchableOpacity>

          <View className="items-center mb-8">
            <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-4 border border-gold/20">
              <Clock color={COLORS.gold} size={28} />
            </View>
            <Text className="text-cream font-inter-bold text-2xl mb-2 text-center">
              What time were you born?
            </Text>
            <Text className="text-cream-muted font-inter text-sm text-center">
              Birth time refines your rising sign and line positions
            </Text>
          </View>

          {/* Unknown time toggle */}
          <TouchableOpacity
            onPress={() => setUnknownTime(!unknownTime)}
            className={`flex-row items-center justify-center py-3 px-4 rounded-xl mb-6 border ${
              unknownTime
                ? "bg-purple/20 border-purple"
                : "bg-surface border-surface-light"
            }`}
          >
            <Text
              className={`font-inter-medium text-sm ${
                unknownTime ? "text-purple-light" : "text-cream-muted"
              }`}
            >
              I don't know my birth time
            </Text>
          </TouchableOpacity>

          {unknownTime ? (
            <View className="bg-surface rounded-2xl p-5 flex-row items-start gap-3">
              <Info color={COLORS.gold} size={20} />
              <Text className="text-cream-muted font-inter text-sm flex-1 leading-5">
                We'll use noon as a default. Some planetary line positions may
                shift slightly. You can always update this later if you find
                your birth time.
              </Text>
            </View>
          ) : (
            <View className="flex-row gap-3">
              <TimeWheel
                value={hour}
                options={hourOptions}
                onChange={(v) => setHour(v as number)}
                label="Hour"
              />
              <TimeWheel
                value={minute}
                options={minuteOptions}
                onChange={(v) => setMinute(v as number)}
                label="Min"
              />
              <TimeWheel
                value={period}
                options={periodOptions}
                onChange={(v) => setPeriod(v as "AM" | "PM")}
                label="Period"
              />
            </View>
          )}
        </View>

        <View className="mb-4">
          <Button title="Next" onPress={handleNext} />
        </View>
      </View>
    </SafeAreaView>
  );
}
