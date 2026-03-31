import React, { useState } from "react";
import { View, Text, Platform } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";

function DateWheel({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: { label: string; value: number }[];
  onChange: (val: number) => void;
  label: string;
}) {
  const currentIndex = options.findIndex((o) => o.value === value);

  return (
    <View className="flex-1 items-center">
      <Text className="text-cream-muted text-xs font-inter-medium mb-3 uppercase tracking-wider">
        {label}
      </Text>
      <View className="bg-surface rounded-2xl py-2 w-full items-center">
        {/* Previous value */}
        <Text
          className="text-cream-muted/30 text-lg font-inter py-2"
          onPress={() => {
            if (currentIndex > 0) onChange(options[currentIndex - 1].value);
          }}
        >
          {currentIndex > 0 ? options[currentIndex - 1].label : ""}
        </Text>

        {/* Current value */}
        <View className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 w-full items-center">
          <Text className="text-gold text-2xl font-inter-bold">
            {options[currentIndex]?.label ?? ""}
          </Text>
        </View>

        {/* Next value */}
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

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function BirthDateScreen() {
  const router = useRouter();
  const { updateOnboarding, onboarding } = useUserStore();

  const existing = onboarding.birthDate;
  const [month, setMonth] = useState(existing ? existing.getMonth() + 1 : 6);
  const [day, setDay] = useState(existing ? existing.getDate() : 15);
  const [year, setYear] = useState(existing ? existing.getFullYear() : 1995);

  const currentYear = new Date().getFullYear();

  const monthOptions = MONTHS.map((m, i) => ({ label: m, value: i + 1 }));
  const dayOptions = Array.from({ length: 31 }, (_, i) => ({
    label: String(i + 1),
    value: i + 1,
  }));
  const yearOptions = Array.from({ length: 100 }, (_, i) => ({
    label: String(currentYear - i),
    value: currentYear - i,
  }));

  function handleNext() {
    const birthDate = new Date(year, month - 1, day);
    updateOnboarding({ birthDate });
    router.push("/(onboarding)/birth-time");
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View className="flex-1 px-6 py-4 justify-between">
        <View>
          <ProgressBar currentStep={1} totalSteps={3} />

          <View className="items-center mt-8 mb-8">
            <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-4 border border-gold/20">
              <Calendar color={COLORS.gold} size={28} />
            </View>
            <Text className="text-cream font-inter-bold text-2xl mb-2 text-center">
              When were you born?
            </Text>
            <Text className="text-cream-muted font-inter text-sm text-center">
              Your birth date shapes your celestial blueprint
            </Text>
          </View>

          {/* Date Wheels */}
          <View className="flex-row gap-3 mt-4">
            <DateWheel
              value={month}
              options={monthOptions}
              onChange={setMonth}
              label="Month"
            />
            <DateWheel
              value={day}
              options={dayOptions}
              onChange={setDay}
              label="Day"
            />
            <DateWheel
              value={year}
              options={yearOptions}
              onChange={setYear}
              label="Year"
            />
          </View>
        </View>

        <View className="mb-4">
          <Button title="Next" onPress={handleNext} />
        </View>
      </View>
    </SafeAreaView>
  );
}
