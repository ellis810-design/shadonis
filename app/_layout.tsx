import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { supabase } from "../services/supabase";
import { useUserStore } from "../stores/userStore";
import { COLORS } from "../constants/theme";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const { setSession, setUser, setLoading, setHasCompletedOnboarding } =
    useUserStore();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function initAuth() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession({
            accessToken: session.access_token,
            userId: session.user.id,
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              birthDate: profile.birth_date,
              birthTime: profile.birth_time,
              birthTimeUnknown: profile.birth_time_unknown,
              birthCity: profile.birth_city,
              birthCountryCode: profile.birth_country_code || "US",
              birthLat: profile.birth_lat,
              birthLng: profile.birth_lng,
              birthTimezone: profile.birth_timezone,
              subscriptionTier: profile.subscription_tier,
              createdAt: profile.created_at,
              updatedAt: profile.updated_at,
            });
            setHasCompletedOnboarding(true);
          }
        }
      } catch {
        // Auth init failed silently — user will be redirected to login
      } finally {
        setLoading(false);
        setAppReady(true);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setSession({
            accessToken: session.access_token,
            userId: session.user.id,
          });
        } else {
          setSession(null);
          setUser(null);
          setHasCompletedOnboarding(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!fontsLoaded || !appReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.background,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={COLORS.gold} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
