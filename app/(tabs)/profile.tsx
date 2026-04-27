import React from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useUserStore } from "../../stores/userStore";
import { Page, Section, Card } from "../../components/ui/Page";
import { PALETTE, TYPE, SPACING, ELEMENT_COLORS } from "../../constants/designSystem";
import { PLANETS } from "../../constants/planets";
import { MOCK_CHART } from "../../constants/mockChart";

const ANCHORS = [
  { key: "sun" as const,    label: "Sun",     data: MOCK_CHART.sun,    note: "core identity" },
  { key: "moon" as const,   label: "Moon",    data: MOCK_CHART.moon,   note: "inner world" },
  { key: "rising" as const, label: "Rising",  data: MOCK_CHART.rising, note: "first impression" },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, name, reset } = useUserStore();
  const { width } = useWindowDimensions();
  const stack = width < 720;

  async function handleStartOver() {
    const confirm = () =>
      Promise.resolve(
        Platform.OS === "web"
          ? window.confirm("Clear this chart and start over?")
          : new Promise<boolean>((resolve) =>
              Alert.alert("Start over", "Clear this chart?", [
                { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
                { text: "Clear", style: "destructive", onPress: () => resolve(true) },
              ])
            )
      );
    const ok = await confirm();
    if (!ok) return;
    reset();
    router.replace("/welcome");
  }

  return (
    <Page
      title="Profile"
      subtitle={"A portrait of your natal chart \u2014 the anchors, patterns, and planetary weight that define your cosmic recipe."}
    >
      <Section label="Anchors">
        <View style={{ flexDirection: stack ? "column" : "row", gap: SPACING.md }}>
          {ANCHORS.map((a) => (
            <View key={a.key} style={{ flex: 1 }}>
              <Card>
                <Text style={[TYPE.sectionLabel, { marginBottom: SPACING.md }]}>
                  {a.label}
                </Text>
                <Text style={[TYPE.cardTitle, { fontSize: 28 }]}>
                  {a.data.sign}
                </Text>
                <Text style={[TYPE.small, { marginTop: 2 }]}>{a.note}</Text>
                <View
                  style={{
                    height: 1,
                    backgroundColor: PALETTE.divider,
                    marginVertical: SPACING.md,
                  }}
                />
                <Text style={TYPE.small}>
                  {`${a.data.element} \u00B7 ${a.data.modality} \u00B7 ruled by ${a.data.rulingPlanet}`}
                </Text>
                <Text style={[TYPE.smallItalic, { marginTop: SPACING.md }]}>
                  {a.data.theme}
                </Text>
              </Card>
            </View>
          ))}
        </View>
      </Section>

      <Section label="Element balance">
        <Card>
          {(["fire", "earth", "air", "water"] as const).map((el) => {
            const pct = MOCK_CHART.elementBalance[el];
            return (
              <View key={el} style={{ marginBottom: SPACING.md }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <Text style={[TYPE.sectionLabel, { color: PALETTE.textSecondary }]}>
                    {el}
                  </Text>
                  <Text style={[TYPE.data, { color: PALETTE.textPrimary }]}>
                    {pct}%
                  </Text>
                </View>
                <View
                  style={{
                    height: 4,
                    backgroundColor: PALETTE.backgroundAlt,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <View
                    style={{
                      height: "100%",
                      width: `${pct}%`,
                      backgroundColor: ELEMENT_COLORS[el],
                      opacity: 0.85,
                    }}
                  />
                </View>
              </View>
            );
          })}
          <Text style={[TYPE.body, { marginTop: SPACING.md }]}>
            {MOCK_CHART.elementSummary}
          </Text>
        </Card>
      </Section>

      <Section label="Dominant planets">
        <Card>
          {MOCK_CHART.dominantPlanets.map((d, idx) => {
            const meta = PLANETS[d.planet];
            const isLast = idx === MOCK_CHART.dominantPlanets.length - 1;
            return (
              <View
                key={d.planet}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: SPACING.md,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: PALETTE.divider,
                }}
              >
                <Text
                  style={{
                    color: meta.color,
                    fontSize: 20,
                    width: 28,
                  }}
                >
                  {meta.glyph}
                </Text>
                <Text style={[TYPE.cardTitle, { flex: 1 }]}>
                  {meta.displayName}
                </Text>
                <Text style={[TYPE.data, { color: PALETTE.textTertiary }]}>
                  {d.aspectCount} aspects
                </Text>
              </View>
            );
          })}
        </Card>
      </Section>

      {user && (
        <Section label="Birth detail">
          <Card>
            <Text style={TYPE.bodyPrimary}>{user.birthCity || MOCK_CHART.birthPlace}</Text>
            <Text style={[TYPE.body, { marginTop: 4 }]}>
              {user.birthDate
                ? new Date(user.birthDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : MOCK_CHART.birthDate}
              {user.birthTime ? ` \u00B7 ${user.birthTime}` : ""}
            </Text>
          </Card>
        </Section>
      )}

      <View style={{ marginTop: SPACING.xxl, alignItems: "flex-start" }}>
        <Pressable onPress={handleStartOver} hitSlop={6}>
          <Text style={[TYPE.sectionLabel, { color: PALETTE.danger }]}>
            Start over
          </Text>
        </Pressable>
        {name ? (
          <Text style={[TYPE.smallItalic, { marginTop: SPACING.sm }]}>
            {`Cast for ${name}.`}
          </Text>
        ) : null}
      </View>
    </Page>
  );
}
