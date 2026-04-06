import React, { useCallback, useEffect, useState } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity } from "react-native";
import AstroGlobe from "./AstroGlobe";
import { LineInfoSheet } from "./LineInfoSheet";
import { useMapStore } from "../../stores/mapStore";
import { useUserStore } from "../../stores/userStore";
import { getPlanetaryLines } from "../../services/astrology";
import { GLOBE_CITIES } from "../../constants/globeCities";
import { COLORS } from "../../constants/theme";

export function AstroGlobeMap() {
  const { user } = useUserStore();
  const {
    planetaryLines,
    selectedLine,
    searchedCity,
    isLoadingLines,
    setPlanetaryLines,
    setSelectedLine,
    setLoadingLines,
    getFilteredLines,
  } = useMapStore();

  const [error, setError] = useState<string | null>(null);

  const loadLines = useCallback(async () => {
    if (!user) return;
    setError(null);
    setLoadingLines(true);
    try {
      const lines = await getPlanetaryLines(
        new Date(user.birthDate),
        user.birthTime ? new Date(`2000-01-01T${user.birthTime}`) : null,
        user.birthLat,
        user.birthLng,
        user.birthCity,
        user.birthCountryCode
      );
      setPlanetaryLines(lines);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load planetary lines";
      console.error("[AstroGlobeMap]", message);
      setError(message);
    } finally {
      setLoadingLines(false);
    }
  }, [user, setPlanetaryLines, setLoadingLines]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  const filteredLines = getFilteredLines();

  if (isLoadingLines) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color={COLORS.gold} />
        <Text className="text-cream-muted mt-4 font-inter">
          Calculating your planetary lines...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text style={{ color: COLORS.danger }} className="font-inter-bold text-center mb-2">
          Failed to load lines
        </Text>
        <Text className="text-cream-muted font-inter text-sm text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={loadLines}
          className="bg-gold px-6 py-3 rounded-xl"
        >
          <Text className="text-background font-inter-bold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, position: "relative" }}>
      <AstroGlobe
        planetaryLines={filteredLines}
        cities={GLOBE_CITIES}
        searchedCity={searchedCity}
        selectedLine={selectedLine}
        onLineSelect={setSelectedLine}
      />
      {selectedLine && (
        <LineInfoSheet line={selectedLine} onClose={() => setSelectedLine(null)} />
      )}
    </View>
  );
}
