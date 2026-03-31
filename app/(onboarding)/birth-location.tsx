import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MapPin, ArrowLeft, Search, Check } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Input } from "../../components/ui/Input";
import { searchCities } from "../../services/geocoding";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";
import { CityResult } from "../../types";

export default function BirthLocationScreen() {
  const router = useRouter();
  const {
    updateOnboarding,
    onboarding,
    session,
    setUser,
    setHasCompletedOnboarding,
  } = useUserStore();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityResult[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = useCallback(
    async (text: string) => {
      setQuery(text);
      if (text.length < 2) {
        setResults([]);
        return;
      }

      setSearching(true);
      try {
        const cities = await searchCities(text);
        setResults(cities);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    },
    []
  );

  function handleSelectCity(city: CityResult) {
    setSelectedCity(city);
    setQuery(city.fullName);
    setResults([]);
    updateOnboarding({
      birthCity: city.fullName,
      birthCountryCode: city.countryCode,
      birthLat: city.lat,
      birthLng: city.lng,
      birthTimezone: city.timezone,
    });
  }

  async function handleGenerate() {
    if (!selectedCity) {
      Alert.alert("Select a city", "Please search and select your birth city.");
      return;
    }
    if (!session) {
      Alert.alert("Error", "You must be logged in to continue.");
      return;
    }

    setLoading(true);
    try {
      const birthDate = onboarding.birthDate;
      const birthTime = onboarding.birthTime;

      if (!birthDate) {
        Alert.alert("Error", "Birth date is missing. Please go back.");
        return;
      }

      const dateStr = `${birthDate.getFullYear()}-${String(
        birthDate.getMonth() + 1
      ).padStart(2, "0")}-${String(birthDate.getDate()).padStart(2, "0")}`;

      const timeStr = birthTime
        ? `${String(birthTime.getHours()).padStart(2, "0")}:${String(
            birthTime.getMinutes()
          ).padStart(2, "0")}:00`
        : null;

      const profileData = {
        id: session.userId,
        birth_date: dateStr,
        birth_time: timeStr,
        birth_time_unknown: onboarding.birthTimeUnknown,
        birth_city: selectedCity.fullName,
        birth_country_code: selectedCity.countryCode,
        birth_lat: selectedCity.lat,
        birth_lng: selectedCity.lng,
        birth_timezone: selectedCity.timezone,
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(profileData, { onConflict: "id" });

      if (error) throw error;

      setUser({
        id: session.userId,
        birthDate: dateStr,
        birthTime: timeStr,
        birthTimeUnknown: onboarding.birthTimeUnknown,
        birthCity: selectedCity.fullName,
        birthCountryCode: selectedCity.countryCode,
        birthLat: selectedCity.lat,
        birthLng: selectedCity.lng,
        birthTimezone: selectedCity.timezone,
        subscriptionTier: "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setHasCompletedOnboarding(true);

      router.replace("/(tabs)/map");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to save profile";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View className="flex-1 px-6 py-4 justify-between">
          <View className="flex-1">
            <ProgressBar currentStep={3} totalSteps={3} />

            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-surface mt-4 mb-4"
            >
              <ArrowLeft color={COLORS.cream} size={20} />
            </TouchableOpacity>

            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full bg-surface items-center justify-center mb-4 border border-gold/20">
                <MapPin color={COLORS.gold} size={28} />
              </View>
              <Text className="text-cream font-inter-bold text-2xl mb-2 text-center">
                Where were you born?
              </Text>
              <Text className="text-cream-muted font-inter text-sm text-center">
                Your birthplace determines your planetary line positions
              </Text>
            </View>

            {/* Search */}
            <View className="relative mb-4">
              <Input
                placeholder="Search for a city..."
                value={query}
                onChangeText={handleSearch}
                autoCapitalize="words"
              />
              <View className="absolute right-4 top-3.5">
                <Search color={COLORS.creamMuted} size={18} />
              </View>
            </View>

            {/* Results */}
            {results.length > 0 && (
              <FlatList
                data={results}
                keyExtractor={(item) => `${item.lat}-${item.lng}`}
                className="max-h-60"
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelectCity(item)}
                    className="flex-row items-center py-3 px-4 bg-surface rounded-xl mb-2"
                  >
                    <MapPin
                      color={COLORS.creamMuted}
                      size={16}
                      style={{ marginRight: 12 }}
                    />
                    <View className="flex-1">
                      <Text className="text-cream font-inter-medium text-base">
                        {item.name}
                      </Text>
                      <Text className="text-cream-muted font-inter text-xs">
                        {item.fullName}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}

            {/* Selected city confirmation */}
            {selectedCity && results.length === 0 && (
              <View className="bg-surface rounded-2xl p-4 flex-row items-center gap-3">
                <View className="w-10 h-10 rounded-full bg-success/20 items-center justify-center">
                  <Check color={COLORS.success} size={20} />
                </View>
                <View className="flex-1">
                  <Text className="text-cream font-inter-medium">
                    {selectedCity.name}
                  </Text>
                  <Text className="text-cream-muted text-xs font-inter">
                    {selectedCity.fullName}
                  </Text>
                </View>
              </View>
            )}
          </View>

          <View className="mb-4">
            <Button
              title="Generate My Map ✦"
              onPress={handleGenerate}
              loading={loading}
              disabled={!selectedCity}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
