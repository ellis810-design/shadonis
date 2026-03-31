import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useUserStore();

  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate(): boolean {
    const newErrors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleAuth() {
    if (!validate()) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSession({
            accessToken: data.session.access_token,
            userId: data.session.user.id,
          });
          router.replace("/(onboarding)/birth-date");
        } else {
          Alert.alert(
            "Check your email",
            "We sent you a confirmation link. Please verify your email to continue."
          );
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        if (data.session) {
          setSession({
            accessToken: data.session.access_token,
            userId: data.session.user.id,
          });

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.session.user.id)
            .single();

          if (profile) {
            router.replace("/(tabs)/map");
          } else {
            router.replace("/(onboarding)/birth-date");
          }
        }
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-4">
            {/* Header */}
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full bg-surface mb-6"
            >
              <ArrowLeft color={COLORS.cream} size={20} />
            </TouchableOpacity>

            <Text className="text-cream font-inter-bold text-3xl mb-2">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </Text>
            <Text className="text-cream-muted font-inter text-base mb-8">
              {isSignUp
                ? "Begin your celestial journey"
                : "Sign in to continue exploring"}
            </Text>

            {/* Form */}
            <View className="gap-4 mb-8">
              <View className="relative">
                <Input
                  label="Email"
                  placeholder="your@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  error={errors.email}
                />
                <View className="absolute right-4 top-10">
                  <Mail color={COLORS.creamMuted} size={18} />
                </View>
              </View>

              <View className="relative">
                <Input
                  label="Password"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={errors.password}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-10"
                >
                  {showPassword ? (
                    <EyeOff color={COLORS.creamMuted} size={18} />
                  ) : (
                    <Eye color={COLORS.creamMuted} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit */}
            <Button
              title={isSignUp ? "Create Account" : "Sign In"}
              onPress={handleAuth}
              loading={loading}
            />

            {/* Toggle */}
            <View className="flex-row items-center justify-center mt-6">
              <Text className="text-cream-muted font-inter">
                {isSignUp
                  ? "Already have an account? "
                  : "Don't have an account? "}
              </Text>
              <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
                <Text className="text-gold font-inter-semibold">
                  {isSignUp ? "Sign In" : "Sign Up"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
