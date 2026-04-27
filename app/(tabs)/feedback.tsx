import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Page, Section } from "../../components/ui/Page";
import { Button } from "../../components/ui/Button";
import { useUserStore } from "../../stores/userStore";
import { submitFeedback } from "../../services/feedback";
import { PALETTE, TYPE, SPACING, RADIUS } from "../../constants/designSystem";

export default function FeedbackScreen() {
  const { name, user } = useUserStore();
  const [feelsAccurate, setFeelsAccurate] = useState<boolean | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleSubmit() {
    if (feelsAccurate === null && !comment.trim()) {
      const msg = "Please choose Yes / No or leave a note before sending.";
      Platform.OS === "web" ? window.alert(msg) : Alert.alert("Almost", msg);
      return;
    }
    setLoading(true);
    setWarning(null);
    try {
      const result = await submitFeedback({
        name: name ?? null,
        feelsAccurate,
        comment: comment.trim() || null,
        birthCity: user?.birthCity ?? null,
        birthDate: user?.birthDate ?? null,
      });
      setSubmitted(true);
      if (!result.delivered) {
        // Saved locally but the network/Formspree request failed — show a
        // soft notice so the participant knows we'll need to follow up.
        setWarning(
          "Saved offline. We'll sync it next time you're online."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <Page title="Thank you, Star.">
        <Text style={[TYPE.smallItalic, { fontSize: 16, marginTop: -SPACING.md }]}>
          Your feedback means the world. We read every note that comes in.
        </Text>
        {warning && (
          <Text
            style={[
              TYPE.small,
              { color: PALETTE.accentSoft, marginTop: SPACING.md },
            ]}
          >
            {warning}
          </Text>
        )}
        <View style={{ marginTop: SPACING.xl, alignSelf: "flex-start" }}>
          <Button
            title="Send another"
            variant="outline"
            onPress={() => {
              setSubmitted(false);
              setComment("");
              setFeelsAccurate(null);
              setWarning(null);
            }}
          />
        </View>
      </Page>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <Page
        title="Share Your Experience"
        subtitle="Your insight helps Shadonis refine these readings."
      >
        <Section label="Does this feel accurate?">
          <View style={{ flexDirection: "row", gap: SPACING.md }}>
            {[
              { label: "Yes", value: true },
              { label: "No", value: false },
            ].map((opt) => {
              const selected = feelsAccurate === opt.value;
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => setFeelsAccurate(opt.value)}
                  style={(state: any) => ({
                    paddingVertical: 12,
                    paddingHorizontal: SPACING.xl,
                    borderRadius: RADIUS.md,
                    borderWidth: 1,
                    borderColor: selected
                      ? PALETTE.accent
                      : state.hovered
                      ? PALETTE.surfaceBorderStrong
                      : PALETTE.surfaceBorder,
                    backgroundColor: selected ? PALETTE.accentMuted : "transparent",
                  })}
                >
                  <Text
                    style={[
                      TYPE.buttonLabel,
                      { color: selected ? PALETTE.accent : PALETTE.textSecondary },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section label="Tell us more">
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="What landed? What missed?"
            placeholderTextColor={PALETTE.textTertiary}
            multiline
            textAlignVertical="top"
            style={{
              minHeight: 140,
              backgroundColor: PALETTE.surface,
              borderWidth: 1,
              borderColor: PALETTE.surfaceBorder,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              color: PALETTE.textPrimary,
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 22,
            }}
          />
        </Section>

        <View style={{ marginTop: SPACING.xl, alignSelf: "flex-start" }}>
          <Button title="Send feedback" onPress={handleSubmit} loading={loading} />
        </View>
      </Page>
    </KeyboardAvoidingView>
  );
}
