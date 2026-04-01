import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BookOpen, ArrowLeft } from "lucide-react-native";
import { PlanetCard } from "../../components/interpretation/PlanetCard";
import { AngleCard } from "../../components/interpretation/AngleCard";
import { PLANETS, ANGLES } from "../../constants/planets";
import { STATIC_INTERPRETATIONS } from "../../constants/interpretations";
import { COLORS } from "../../constants/theme";
import { Planet } from "../../types";

export default function InterpretationsScreen() {
  const [selectedPlanet, setSelectedPlanet] = useState<Planet | null>(null);

  const planets = Object.keys(PLANETS) as Planet[];

  if (selectedPlanet) {
    const meta = PLANETS[selectedPlanet];
    const interpretations = STATIC_INTERPRETATIONS.filter(
      (i) => i.planet === selectedPlanet
    );

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View className="flex-1 px-4 py-4">
          <View className="flex-row items-center gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setSelectedPlanet(null)}
              className="w-10 h-10 rounded-full bg-surface items-center justify-center"
            >
              <ArrowLeft color={COLORS.cream} size={20} />
            </TouchableOpacity>
            <View
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: `${meta.color}20` }}
            >
              <Text style={{ color: meta.color, fontSize: 20 }}>
                {meta.glyph}
              </Text>
            </View>
            <View>
              <Text className="text-cream font-inter-bold text-xl">
                {meta.displayName}
              </Text>
              <Text className="text-cream-muted font-inter text-xs">
                {meta.description}
              </Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {interpretations.length > 0 ? (
              <View className="gap-3">
                {interpretations.map((interp, idx) => (
                  <AngleCard
                    key={idx}
                    angle={interp.angle}
                    whatItFeelsLike={interp.whatItFeelsLike}
                    shortTheme={interp.shortTheme}
                    bestUseCases={interp.bestUseCases}
                    watchOuts={interp.watchOuts}
                  />
                ))}
              </View>
            ) : (
              <View className="items-center py-12">
                <Text className="text-cream-muted font-inter text-center">
                  Interpretations for {meta.displayName} coming soon.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <View className="flex-1 px-4 py-4">
        <View className="flex-row items-center gap-3 mb-6">
          <BookOpen color={COLORS.gold} size={24} />
          <View>
            <Text className="text-cream font-inter-bold text-xl">
              Readings
            </Text>
            <Text className="text-cream-muted font-inter text-xs">
              Explore planetary interpretations by Shadonis
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {planets.map((planet) => (
              <PlanetCard
                key={planet}
                planet={planet}
                onPress={() => setSelectedPlanet(planet)}
              />
            ))}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
