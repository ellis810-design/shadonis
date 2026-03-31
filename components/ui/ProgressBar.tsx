import React from "react";
import { View, Text } from "react-native";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  showLabel?: boolean;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  showLabel = true,
}: ProgressBarProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="w-full">
      {showLabel && (
        <Text className="text-cream-muted text-xs font-inter-medium mb-2 text-center">
          Step {currentStep} of {totalSteps}
        </Text>
      )}
      <View className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
        <View
          className="h-full bg-gold rounded-full"
          style={{ width: `${progress}%` }}
        />
      </View>
    </View>
  );
}
