import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { AstroGlobeMap } from "../../components/map/AstroGlobeMap";
import { useMapStore } from "../../stores/mapStore";
import { PALETTE, TYPE, SPACING, RADIUS, LAYOUT } from "../../constants/designSystem";
import { LIFE_GOALS } from "../../constants/mockChart";
import { ANGLES } from "../../constants/planets";
import { Planet } from "../../types";

const LINE_LEGEND: Array<{ code: keyof typeof ANGLES; meaning: string }> = [
  { code: "mc",  meaning: "planet overhead" },
  { code: "ic",  meaning: "planet underfoot" },
  { code: "asc", meaning: "planet rising" },
  { code: "dsc", meaning: "planet setting" },
];

export default function MapScreen() {
  const { width, height } = useWindowDimensions();
  const isMobile = width < 880;
  // In landscape, give the globe at least 65% of the viewport height
  // (and at least 600px). Mobile keeps the previous compact 480px.
  const globeHeight = isMobile ? 480 : Math.max(600, Math.round(height * 0.7));

  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  const [compareCity, setCompareCity] = useState("");

  const toggleGoal = useCallback(
    (id: string) => {
      setSelectedGoals((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);

        // No goals selected → no lines drawn. Otherwise the union of
        // each selected goal's planets is what shows on the globe.
        const uniq = new Set<Planet>();
        for (const goal of LIFE_GOALS) {
          if (next.has(goal.id)) goal.planets.forEach((p) => uniq.add(p));
        }
        useMapStore.setState({ visiblePlanets: uniq });
        return next;
      });
    },
    []
  );

  return (
    <View style={{ flex: 1, backgroundColor: PALETTE.background, position: "relative" }}>
      {/* Title strip */}
      <View
        style={{
          paddingHorizontal: isMobile ? LAYOUT.pagePadXMobile : LAYOUT.pagePadX,
          paddingTop: SPACING.lg,
          paddingBottom: SPACING.md,
          maxWidth: LAYOUT.maxWidth,
          width: "100%",
          alignSelf: "center",
        }}
      >
        <Text style={[TYPE.pageTitle, { fontSize: 28 }]}>
          Your Astrocartography
        </Text>
        <Text style={[TYPE.pageSubtitle, { marginTop: SPACING.xs, maxWidth: 720 }]}>
          Your chart in relation to planet earth. Click each line to explore
        </Text>
      </View>

      {/* Globe + sidebar */}
      <View
        style={{
          flex: 1,
          flexDirection: isMobile ? "column" : "row",
          maxWidth: LAYOUT.maxWidth,
          width: "100%",
          alignSelf: "center",
          paddingHorizontal: isMobile ? 0 : LAYOUT.pagePadX,
          paddingBottom: SPACING.xl,
          gap: SPACING.lg,
        }}
      >
        {/* Globe pane — fixed height on mobile (no flex grow), flex on desktop */}
        <View
          style={{
            position: "relative",
            backgroundColor: "#000",
            borderWidth: 1,
            borderColor: PALETTE.surfaceBorder,
            borderRadius: RADIUS.md,
            overflow: "hidden",
            ...(isMobile
              ? { height: globeHeight, width: "100%" }
              : { flex: 1, minHeight: globeHeight }),
          }}
        >
          {/* Key on width forces a fresh GL context after rotation /
              breakpoint changes — the GLView's drawing buffer can't be
              resized after creation, so we remount instead. */}
          <AstroGlobeMap key={`globe-${Math.round(width)}`} />
          <LineLegend />
          {isMobile && (
            <Pressable
              onPress={() => setSidebarOpen((o) => !o)}
              style={{
                position: "absolute",
                top: SPACING.md,
                right: SPACING.md,
                paddingVertical: 8,
                paddingHorizontal: SPACING.md,
                borderWidth: 1,
                borderColor: PALETTE.surfaceBorderStrong,
                borderRadius: RADIUS.md,
                backgroundColor: "rgba(10,10,10,0.85)",
                zIndex: 5,
              }}
            >
              <Text style={[TYPE.buttonLabel, { color: PALETTE.accent }]}>
                {sidebarOpen ? "Close" : "Filters"}
              </Text>
            </Pressable>
          )}
        </View>

        {/* Desktop sidebar — inline column to the right of the globe */}
        {!isMobile && sidebarOpen && (
          <Sidebar
            isMobile={false}
            selectedGoals={selectedGoals}
            onToggleGoal={toggleGoal}
            compareCity={compareCity}
            onCompareCityChange={setCompareCity}
            onClose={() => setSidebarOpen(false)}
          />
        )}
      </View>

      {/* Mobile sidebar — full-height drawer overlaying from the right.
          Lives outside the globe-row container so it never competes with
          the globe pane for layout space. */}
      {isMobile && sidebarOpen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "85%",
            maxWidth: 360,
            backgroundColor: PALETTE.background,
            borderLeftWidth: 1,
            borderLeftColor: PALETTE.surfaceBorderStrong,
            paddingTop: SPACING.xl,
            paddingHorizontal: SPACING.lg,
            zIndex: 100,
            ...({
              boxShadow: "-12px 0 32px rgba(0,0,0,0.65)",
            } as any),
          }}
        >
          <Pressable
            onPress={() => setSidebarOpen(false)}
            style={{ alignSelf: "flex-end", padding: 6, marginBottom: SPACING.md }}
            hitSlop={8}
          >
            <Text style={[TYPE.buttonLabel, { color: PALETTE.accent }]}>
              Close
            </Text>
          </Pressable>
          <Sidebar
            isMobile
            selectedGoals={selectedGoals}
            onToggleGoal={toggleGoal}
            compareCity={compareCity}
            onCompareCityChange={setCompareCity}
            onClose={() => setSidebarOpen(false)}
          />
        </View>
      )}
    </View>
  );
}

function LineLegend() {
  return (
    <View
      style={{
        position: "absolute",
        left: SPACING.md,
        bottom: SPACING.md,
        backgroundColor: "rgba(10,10,10,0.78)",
        borderWidth: 1,
        borderColor: PALETTE.surfaceBorder,
        borderRadius: RADIUS.md,
        paddingVertical: SPACING.xs + 2,
        paddingHorizontal: SPACING.sm + 2,
      }}
    >
      <Text style={[TYPE.sectionLabel, { marginBottom: 4, fontSize: 10, letterSpacing: 1.4 }]}>
        Line types
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          maxWidth: 220,
        }}
      >
        {LINE_LEGEND.map((row) => (
          <Text
            key={row.code}
            style={[
              TYPE.data,
              { color: PALETTE.accent, fontSize: 12, letterSpacing: 0.5 },
            ]}
          >
            {row.code.toUpperCase()}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface SidebarProps {
  isMobile: boolean;
  selectedGoals: Set<string>;
  onToggleGoal: (id: string) => void;
  compareCity: string;
  onCompareCityChange: (v: string) => void;
  onClose: () => void;
}

function Sidebar({
  isMobile,
  selectedGoals,
  onToggleGoal,
  compareCity,
  onCompareCityChange,
}: SidebarProps) {
  return (
    <ScrollView
      style={{
        width: isMobile ? "100%" : 280,
        maxHeight: isMobile ? 360 : undefined,
      }}
      contentContainerStyle={{
        paddingHorizontal: isMobile ? LAYOUT.pagePadXMobile : 0,
        paddingTop: SPACING.md,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[TYPE.sectionLabel, { marginBottom: SPACING.md }]}>
        Life goals
      </Text>
      <View style={{ marginBottom: SPACING.xl }}>
        {LIFE_GOALS.map((goal) => {
          const checked = selectedGoals.has(goal.id);
          return (
            <Pressable
              key={goal.id}
              onPress={() => onToggleGoal(goal.id)}
              style={(state: any) => ({
                flexDirection: "row",
                alignItems: "center",
                paddingVertical: 10,
                paddingHorizontal: SPACING.sm,
                borderRadius: RADIUS.sm,
                backgroundColor: state.hovered ? PALETTE.accentMuted : "transparent",
              })}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderWidth: 1,
                  borderColor: checked ? PALETTE.accent : PALETTE.surfaceBorderStrong,
                  backgroundColor: checked ? PALETTE.accent : "transparent",
                  borderRadius: 2,
                  marginRight: SPACING.md,
                }}
              />
              <Text
                style={[
                  TYPE.body,
                  { color: checked ? PALETTE.textPrimary : PALETTE.textSecondary },
                ]}
              >
                {goal.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Best-match places + Compare places hidden for the focus-group
          build \u2014 kept in source so we can re-enable when the matching
          logic is ready. */}
    </ScrollView>
  );
}
