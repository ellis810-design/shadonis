import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { PlanetaryLine } from "../../types";
import { PLANETS, ANGLES } from "../../constants/planets";
import { STATIC_INTERPRETATIONS } from "../../constants/interpretations";
import { COLORS } from "../../constants/theme";

interface LineInfoSheetProps {
  line: PlanetaryLine;
  onClose: () => void;
}

export function LineInfoSheet({ line, onClose }: LineInfoSheetProps) {
  const planet = PLANETS[line.planet];
  const angle = ANGLES[line.angle];

  const interpretation = STATIC_INTERPRETATIONS.find(
    (i) => i.planet === line.planet && i.angle === line.angle
  );

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-surface rounded-t-3xl p-6 pb-10 max-h-[60%]">
      {/* Handle */}
      <View className="w-10 h-1 bg-cream-muted/30 rounded-full self-center mb-4" />

      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: `${line.color}20` }}
          >
            <Text style={{ color: line.color, fontSize: 20 }}>
              {planet.glyph}
            </Text>
          </View>
          <View>
            <Text className="text-cream font-inter-bold text-lg">
              {planet.displayName} {angle.displayName}
            </Text>
            {interpretation && (
              <Text className="text-gold font-inter text-xs">
                {interpretation.shortTheme}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity
          onPress={onClose}
          className="w-8 h-8 rounded-full bg-surface-light items-center justify-center"
        >
          <X color={COLORS.creamMuted} size={16} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {interpretation ? (
          <View className="gap-4">
            <View>
              <Text className="text-gold font-inter-semibold text-sm mb-1">
                What it feels like
              </Text>
              <Text className="text-cream font-inter text-sm leading-5">
                {interpretation.whatItFeelsLike}
              </Text>
            </View>
            <View>
              <Text className="text-gold font-inter-semibold text-sm mb-1">
                Best for
              </Text>
              <Text className="text-cream font-inter text-sm leading-5">
                {interpretation.bestUseCases}
              </Text>
            </View>
            <View>
              <Text className="text-gold font-inter-semibold text-sm mb-1">
                Watch out
              </Text>
              <Text className="text-cream font-inter text-sm leading-5">
                {interpretation.watchOuts}
              </Text>
            </View>
          </View>
        ) : (
          <View className="py-6 items-center">
            <Text className="text-cream-muted font-inter text-sm text-center">
              {planet.description}
            </Text>
            <Text className="text-cream-muted font-inter text-xs mt-2 text-center">
              Detailed interpretation coming soon.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
