import React from "react";
import { View, Text } from "react-native";
import { Marker } from "react-native-maps";
import { MapPin } from "lucide-react-native";
import { COLORS } from "../../constants/theme";

interface CityMarkerProps {
  name: string;
  latitude: number;
  longitude: number;
  nearbyLines?: string[];
  onPress?: () => void;
}

export function CityMarker({
  name,
  latitude,
  longitude,
  nearbyLines = [],
  onPress,
}: CityMarkerProps) {
  return (
    <Marker
      coordinate={{ latitude, longitude }}
      onPress={onPress}
    >
      <View className="items-center">
        <View className="bg-gold rounded-full p-1.5">
          <MapPin color={COLORS.background} size={14} />
        </View>
        <View className="bg-surface/90 rounded-lg px-2 py-1 mt-1">
          <Text className="text-cream text-xs font-inter-medium">{name}</Text>
          {nearbyLines.length > 0 && (
            <Text className="text-gold text-[10px] font-inter">
              {nearbyLines.length} line{nearbyLines.length !== 1 ? "s" : ""}{" "}
              nearby
            </Text>
          )}
        </View>
      </View>
    </Marker>
  );
}
