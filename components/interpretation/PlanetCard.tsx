import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { PLANETS } from "../../constants/planets";
import { STATIC_INTERPRETATIONS } from "../../constants/interpretations";
import { Planet } from "../../types";
import { COLORS } from "../../constants/theme";

interface PlanetCardProps {
  planet: Planet;
  onPress?: () => void;
}

export function PlanetCard({ planet, onPress }: PlanetCardProps) {
  const meta = PLANETS[planet];
  const interpretationCount = STATIC_INTERPRETATIONS.filter(
    (i) => i.planet === planet
  ).length;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-surface rounded-2xl p-4 flex-row items-center"
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center mr-4"
        style={{ backgroundColor: `${meta.color}20` }}
      >
        <Text style={{ color: meta.color, fontSize: 24 }}>{meta.glyph}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-cream font-inter-semibold text-base">
          {meta.displayName}
        </Text>
        <Text className="text-cream-muted font-inter text-xs mt-0.5">
          {meta.description}
        </Text>
        {interpretationCount > 0 && (
          <Text className="text-gold font-inter text-xs mt-1">
            {interpretationCount} reading{interpretationCount !== 1 ? "s" : ""}{" "}
            available
          </Text>
        )}
      </View>
      <ChevronRight color={COLORS.creamMuted} size={18} />
    </TouchableOpacity>
  );
}
