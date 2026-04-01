import React from "react";
import { View, Text } from "react-native";
import { Angle } from "../../types";
import { ANGLES } from "../../constants/planets";

interface AngleCardProps {
  angle: Angle;
  whatItFeelsLike: string;
  shortTheme: string;
  bestUseCases: string;
  watchOuts: string;
}

export function AngleCard({
  angle,
  whatItFeelsLike,
  shortTheme,
  bestUseCases,
  watchOuts,
}: AngleCardProps) {
  const angleInfo = ANGLES[angle];

  return (
    <View className="bg-surface rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-2">
        <View className="bg-purple/20 rounded-lg px-2 py-1">
          <Text className="text-purple-light font-inter-bold text-xs uppercase">
            {angleInfo.displayName}
          </Text>
        </View>
      </View>
      <Text className="text-gold font-inter-semibold text-sm mb-1">
        {shortTheme}
      </Text>
      <Text className="text-cream font-inter text-sm leading-5 mb-3">
        {whatItFeelsLike}
      </Text>
      <Text className="text-cream-muted font-inter-bold text-xs uppercase mb-1">
        Best use
      </Text>
      <Text className="text-cream-muted font-inter text-xs leading-5 mb-3">
        {bestUseCases}
      </Text>
      <Text className="text-cream-muted font-inter-bold text-xs uppercase mb-1">
        Watch out
      </Text>
      <Text className="text-cream-muted font-inter text-xs leading-5">
        {watchOuts}
      </Text>
    </View>
  );
}
