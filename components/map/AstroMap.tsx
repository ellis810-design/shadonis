import React, { useRef, useEffect, useCallback } from "react";
import { View, ActivityIndicator, Text, Platform } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useMapStore } from "../../stores/mapStore";
import { useUserStore } from "../../stores/userStore";
import { getPlanetaryLines } from "../../services/astrology";
import { PlanetaryLineOverlay } from "./PlanetaryLine";
import { CityMarker } from "./CityMarker";
import { LineInfoSheet } from "./LineInfoSheet";
import { DARK_MAP_STYLE, COLORS } from "../../constants/theme";
import { PlanetaryLine } from "../../types";

export function AstroMap() {
  const mapRef = useRef<MapView>(null);
  const { user } = useUserStore();
  const {
    planetaryLines,
    selectedLine,
    searchedCity,
    isLoadingLines,
    region,
    setPlanetaryLines,
    setSelectedLine,
    setRegion,
    setLoadingLines,
    getFilteredLines,
  } = useMapStore();

  const loadLines = useCallback(async () => {
    if (!user) return;

    setLoadingLines(true);
    try {
      const lines = await getPlanetaryLines(
        new Date(user.birthDate),
        user.birthTime ? new Date(`2000-01-01T${user.birthTime}`) : null,
        user.birthLat,
        user.birthLng,
        user.birthCity,
        user.birthCountryCode,
      );
      setPlanetaryLines(lines);
    } catch {
      // Silently handle — lines will be empty
    } finally {
      setLoadingLines(false);
    }
  }, [user]);

  useEffect(() => {
    loadLines();
  }, [loadLines]);

  useEffect(() => {
    if (searchedCity && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: searchedCity.lat,
          longitude: searchedCity.lng,
          latitudeDelta: 10,
          longitudeDelta: 10,
        },
        800
      );
    }
  }, [searchedCity]);

  const filteredLines = getFilteredLines();

  function handleLinePress(line: PlanetaryLine) {
    setSelectedLine(line);
  }

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

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        className="flex-1"
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        customMapStyle={DARK_MAP_STYLE}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        mapType="standard"
        showsUserLocation={false}
        showsCompass={false}
        showsScale={false}
        toolbarEnabled={false}
      >
        {filteredLines.map((line, idx) => (
          <PlanetaryLineOverlay
            key={`${line.planet}-${line.angle}-${idx}`}
            line={line}
            isSelected={
              selectedLine?.planet === line.planet &&
              selectedLine?.angle === line.angle
            }
            onPress={() => handleLinePress(line)}
          />
        ))}

        {searchedCity && (
          <CityMarker
            name={searchedCity.name}
            latitude={searchedCity.lat}
            longitude={searchedCity.lng}
          />
        )}
      </MapView>

      {selectedLine && (
        <LineInfoSheet
          line={selectedLine}
          onClose={() => setSelectedLine(null)}
        />
      )}
    </View>
  );
}
