import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search, Filter, X, Sparkles } from "lucide-react-native";
import { AstroGlobeMap } from "../../components/map/AstroGlobeMap";
import { searchCities } from "../../services/geocoding";
import { useMapStore } from "../../stores/mapStore";
import { PLANETS, ANGLES } from "../../constants/planets";
import { COLORS } from "../../constants/theme";
import { CityResult, Planet, Angle } from "../../types";

export default function MapScreen() {
  const { setSearchedCity, visiblePlanets, visibleAngles, togglePlanet, toggleAngle } =
    useMapStore();

  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CityResult[]>([]);

  const handleCitySearch = useCallback(async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    const results = await searchCities(text);
    setSearchResults(results);
  }, []);

  function handleCitySelect(city: CityResult) {
    setSearchedCity({ name: city.name, lat: city.lat, lng: city.lng });
    setShowSearch(false);
    setSearchQuery("");
    setSearchResults([]);
  }

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView edges={["top"]} style={{ backgroundColor: COLORS.surface }}>
        <View className="px-4 py-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Sparkles color={COLORS.gold} size={20} />
            <Text className="text-cream font-inter-bold text-lg">
              Your Celestial Map
            </Text>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => {
                setShowSearch(!showSearch);
                setShowFilters(false);
              }}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                showSearch ? "bg-gold" : "bg-surface-light"
              }`}
            >
              <Search
                color={showSearch ? COLORS.background : COLORS.cream}
                size={16}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowFilters(!showFilters);
                setShowSearch(false);
              }}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                showFilters ? "bg-gold" : "bg-surface-light"
              }`}
            >
              <Filter
                color={showFilters ? COLORS.background : COLORS.cream}
                size={16}
              />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View className="px-4 pb-3">
            <View className="flex-row items-center bg-background rounded-xl px-3">
              <Search color={COLORS.creamMuted} size={16} />
              <TextInput
                className="flex-1 text-cream font-inter py-3 px-2"
                placeholder="Search a city..."
                placeholderTextColor={COLORS.creamMuted}
                value={searchQuery}
                onChangeText={handleCitySearch}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                >
                  <X color={COLORS.creamMuted} size={16} />
                </TouchableOpacity>
              )}
            </View>
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => `${item.lat}-${item.lng}`}
                className="mt-2 max-h-48"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleCitySelect(item)}
                    className="py-2.5 px-3 bg-background rounded-lg mb-1"
                  >
                    <Text className="text-cream font-inter-medium text-sm">
                      {item.name}
                    </Text>
                    <Text className="text-cream-muted font-inter text-xs">
                      {item.fullName}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        )}

        {showFilters && (
          <View className="px-4 pb-3">
            <Text className="text-cream-muted font-inter-medium text-xs mb-2 uppercase tracking-wider">
              Planets
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <View className="flex-row gap-1.5">
                {(Object.keys(PLANETS) as Planet[]).map((planet) => {
                  const meta = PLANETS[planet];
                  const isActive = visiblePlanets.has(planet);
                  return (
                    <TouchableOpacity
                      key={planet}
                      onPress={() => togglePlanet(planet)}
                      className={`px-3 py-1.5 rounded-full flex-row items-center gap-1 ${
                        isActive ? "bg-surface-light" : "bg-background"
                      }`}
                    >
                      <Text style={{ color: isActive ? meta.color : COLORS.creamMuted, fontSize: 14 }}>
                        {meta.glyph}
                      </Text>
                      <Text
                        className={`text-xs font-inter-medium ${
                          isActive ? "text-cream" : "text-cream-muted"
                        }`}
                      >
                        {meta.displayName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Text className="text-cream-muted font-inter-medium text-xs mb-2 uppercase tracking-wider">
              Angles
            </Text>
            <View className="flex-row gap-1.5 flex-wrap">
              {(Object.keys(ANGLES) as Angle[]).map((angle) => {
                const isActive = visibleAngles.has(angle);
                return (
                  <TouchableOpacity
                    key={angle}
                    onPress={() => toggleAngle(angle)}
                    className={`px-3 py-1.5 rounded-full ${
                      isActive ? "bg-purple/30" : "bg-background"
                    }`}
                  >
                    <Text
                      className={`text-xs font-inter-medium ${
                        isActive ? "text-purple-light" : "text-cream-muted"
                      }`}
                    >
                      {ANGLES[angle].displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </SafeAreaView>

      <AstroGlobeMap />
    </View>
  );
}
