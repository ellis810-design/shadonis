import React, { useMemo } from "react";
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
import type { NatalPosition } from "../../services/astrology";
import { parseLocalDate } from "../../services/dateUtils";

function formatBirthTime12h(timeStr: string): string {
  // Stored as "HH:MM:SS" 24-hour. Render as 12-hour with AM/PM.
  const [hh = 0, mm = 0] = timeStr.split(":").map((n) => parseInt(n, 10));
  const period = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}:${String(mm).padStart(2, "0")} ${period}`;
}

// Sign meta — element / modality / ruling planet for the 12 tropical signs.
const SIGN_META: Record<string, { element: string; modality: string; ruledBy: string; theme: string }> = {
  aries:       { element: "fire",  modality: "cardinal", ruledBy: "Mars",    theme: "First through the door — your edge is initiative." },
  taurus:      { element: "earth", modality: "fixed",    ruledBy: "Venus",   theme: "A grounded sensualist. You hold what others reach for." },
  gemini:      { element: "air",   modality: "mutable",  ruledBy: "Mercury", theme: "Quick-witted, wide-receiving — you live in the conversation." },
  cancer:      { element: "water", modality: "cardinal", ruledBy: "Moon",    theme: "An inner tide pulling you toward home, family, and felt safety." },
  leo:         { element: "fire",  modality: "fixed",    ruledBy: "Sun",     theme: "A radiant centre of gravity — designed to be witnessed." },
  virgo:       { element: "earth", modality: "mutable",  ruledBy: "Mercury", theme: "Precision in service of meaning. The detail IS the message." },
  libra:       { element: "air",   modality: "cardinal", ruledBy: "Venus",   theme: "A diplomat for beauty — you orchestrate what feels right." },
  scorpio:     { element: "water", modality: "fixed",    ruledBy: "Pluto",   theme: "Depth without flinching — you go where most won't." },
  sagittarius: { element: "fire",  modality: "mutable",  ruledBy: "Jupiter", theme: "A truth-seeker at altitude — the long view is your gift." },
  capricorn:   { element: "earth", modality: "cardinal", ruledBy: "Saturn",  theme: "Slow architecture of a life that lasts." },
  aquarius:    { element: "air",   modality: "fixed",    ruledBy: "Uranus",  theme: "An outsider's clarity — you see the system from above." },
  pisces:      { element: "water", modality: "mutable",  ruledBy: "Neptune", theme: "Permeable, oceanic — you feel the room before it speaks." },
};

interface Anchor {
  key: "sun" | "moon" | "rising";
  label: string;
  note: string;
  signKey: string;     // lowercase ("leo", "cancer", ...)
  signDisplay: string; // capitalized
  element: string;
  modality: string;
  ruledBy: string;
  theme: string;
}

function buildAnchors(positions: NatalPosition[] | null): Anchor[] | null {
  if (!positions) return null;
  const sun = positions.find((p) => p.body === "Sun");
  const moon = positions.find((p) => p.body === "Moon");
  const asc = positions.find((p) => p.body === "Ascendant");
  if (!sun || !moon || !asc) return null;

  function build(
    key: Anchor["key"],
    label: string,
    note: string,
    pos: NatalPosition,
  ): Anchor {
    const meta = SIGN_META[pos.sign] ?? {
      element: "—", modality: "—", ruledBy: "—",
      theme: "Sign metadata unavailable.",
    };
    return {
      key, label, note,
      signKey: pos.sign,
      signDisplay: pos.sign.charAt(0).toUpperCase() + pos.sign.slice(1),
      ...meta,
    };
  }

  return [
    build("sun",    "Sun",    "core identity",     sun),
    build("moon",   "Moon",   "inner world",       moon),
    build("rising", "Rising", "first impression",  asc),
  ];
}

// Mock fallback used only when the live positions haven't been fetched yet.
const MOCK_ANCHORS: Anchor[] = [
  { key: "sun", label: "Sun", note: "core identity",
    signKey: MOCK_CHART.sun.sign.toLowerCase(), signDisplay: MOCK_CHART.sun.sign,
    element: MOCK_CHART.sun.element, modality: MOCK_CHART.sun.modality,
    ruledBy: MOCK_CHART.sun.rulingPlanet, theme: MOCK_CHART.sun.theme },
  { key: "moon", label: "Moon", note: "inner world",
    signKey: MOCK_CHART.moon.sign.toLowerCase(), signDisplay: MOCK_CHART.moon.sign,
    element: MOCK_CHART.moon.element, modality: MOCK_CHART.moon.modality,
    ruledBy: MOCK_CHART.moon.rulingPlanet, theme: MOCK_CHART.moon.theme },
  { key: "rising", label: "Rising", note: "first impression",
    signKey: MOCK_CHART.rising.sign.toLowerCase(), signDisplay: MOCK_CHART.rising.sign,
    element: MOCK_CHART.rising.element, modality: MOCK_CHART.rising.modality,
    ruledBy: MOCK_CHART.rising.rulingPlanet, theme: MOCK_CHART.rising.theme },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { user, name, reset, natalPositions } = useUserStore();
  const { width } = useWindowDimensions();
  const stack = width < 720;

  // Real anchors when the API has answered, otherwise the mock fallback.
  const anchors = useMemo(
    () => buildAnchors(natalPositions) ?? MOCK_ANCHORS,
    [natalPositions]
  );
  const isLive = !!natalPositions;

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
      <Section label={isLive ? "Anchors · Tropical zodiac" : "Anchors · sample"}>
        <View style={{ flexDirection: stack ? "column" : "row", gap: SPACING.md }}>
          {anchors.map((a) => (
            <View key={a.key} style={{ flex: 1 }}>
              <Card>
                <Text style={[TYPE.sectionLabel, { marginBottom: SPACING.md }]}>
                  {a.label}
                </Text>
                <Text style={[TYPE.cardTitle, { fontSize: 28 }]}>
                  {a.signDisplay}
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
                  {`${a.element} · ${a.modality} · ruled by ${a.ruledBy}`}
                </Text>
                <Text style={[TYPE.smallItalic, { marginTop: SPACING.md }]}>
                  {a.theme}
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
                ? parseLocalDate(user.birthDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : MOCK_CHART.birthDate}
              {user.birthTime && !user.birthTimeUnknown
                ? ` · ${formatBirthTime12h(user.birthTime)}`
                : user.birthTimeUnknown
                ? " · time unknown"
                : ""}
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
