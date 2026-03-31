import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, ThumbsUp, ThumbsDown, Send } from "lucide-react-native";
import { Button } from "../../components/ui/Button";
import { supabase } from "../../services/supabase";
import { useUserStore } from "../../stores/userStore";
import { COLORS } from "../../constants/theme";

export default function FeedbackScreen() {
  const { session } = useUserStore();
  const [feelsAccurate, setFeelsAccurate] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (feelsAccurate === null && !comment.trim()) {
      Alert.alert(
        "Share your thoughts",
        "Please select an accuracy rating or write a comment."
      );
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: session?.userId,
        feels_accurate: feelsAccurate,
        comment: comment.trim() || null,
        screen_context: "feedback_tab",
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit feedback";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFeelsAccurate(null);
    setComment("");
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center mb-6">
            <Send color={COLORS.success} size={32} />
          </View>
          <Text className="text-cream font-inter-bold text-2xl mb-2 text-center">
            Thank you!
          </Text>
          <Text className="text-cream-muted font-inter text-center mb-8">
            Your feedback helps Shadonis grow and improve. We read every
            response.
          </Text>
          <Button
            title="Send More Feedback"
            variant="outline"
            onPress={handleReset}
          />
        </View>
      </SafeAreaView>
    );
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
            <View className="flex-row items-center gap-3 mb-6">
              <MessageCircle color={COLORS.gold} size={24} />
              <View>
                <Text className="text-cream font-inter-bold text-xl">
                  Feedback
                </Text>
                <Text className="text-cream-muted font-inter text-xs">
                  Help us refine your experience
                </Text>
              </View>
            </View>

            {/* Accuracy */}
            <Text className="text-cream font-inter-semibold text-base mb-3">
              Do the readings feel accurate to you?
            </Text>
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={() => setFeelsAccurate(true)}
                className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border-2 ${
                  feelsAccurate === true
                    ? "bg-success/10 border-success"
                    : "bg-surface border-surface-light"
                }`}
              >
                <ThumbsUp
                  color={feelsAccurate === true ? COLORS.success : COLORS.creamMuted}
                  size={20}
                />
                <Text
                  className={`font-inter-medium ${
                    feelsAccurate === true ? "text-success" : "text-cream-muted"
                  }`}
                >
                  Yes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFeelsAccurate(false)}
                className={`flex-1 flex-row items-center justify-center gap-2 py-4 rounded-2xl border-2 ${
                  feelsAccurate === false
                    ? "bg-danger/10 border-danger"
                    : "bg-surface border-surface-light"
                }`}
              >
                <ThumbsDown
                  color={feelsAccurate === false ? COLORS.danger : COLORS.creamMuted}
                  size={20}
                />
                <Text
                  className={`font-inter-medium ${
                    feelsAccurate === false ? "text-danger" : "text-cream-muted"
                  }`}
                >
                  Not really
                </Text>
              </TouchableOpacity>
            </View>

            {/* Comment */}
            <Text className="text-cream font-inter-semibold text-base mb-3">
              Tell us more (optional)
            </Text>
            <TextInput
              className="bg-surface border-2 border-surface-light rounded-2xl p-4 text-cream font-inter text-base min-h-[120px]"
              placeholder="What's on your mind? Any features you'd love to see?"
              placeholderTextColor={COLORS.creamMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
            />

            <View className="mt-8">
              <Button
                title="Submit Feedback"
                onPress={handleSubmit}
                loading={loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
