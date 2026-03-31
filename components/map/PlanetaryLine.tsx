import React from "react";
import { Polyline } from "react-native-maps";
import { PlanetaryLine as PlanetaryLineType } from "../../types";

interface PlanetaryLineProps {
  line: PlanetaryLineType;
  onPress?: () => void;
  isSelected?: boolean;
}

export function PlanetaryLineOverlay({
  line,
  onPress,
  isSelected = false,
}: PlanetaryLineProps) {
  return (
    <Polyline
      coordinates={line.coordinates.map((c) => ({
        latitude: c.lat,
        longitude: c.lng,
      }))}
      strokeColor={isSelected ? "#FFFFFF" : line.color}
      strokeWidth={isSelected ? 3 : 2}
      lineDashPattern={line.angle === "ic" || line.angle === "dsc" ? [8, 4] : undefined}
      tappable
      onPress={onPress}
    />
  );
}
