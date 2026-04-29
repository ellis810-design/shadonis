import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  useWindowDimensions,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Settings } from "lucide-react-native";
import {
  PALETTE,
  TYPE,
  LAYOUT,
  SPACING,
  FONTS,
} from "../../constants/designSystem";
import { PLANETS } from "../../constants/planets";
import { MOCK_CHART } from "../../constants/mockChart";
import { useUserStore } from "../../stores/userStore";

const TABS = [
  { label: "Profile", path: "/(tabs)/profile" },
  { label: "Map", path: "/(tabs)/map" },
  { label: "Chart", path: "/(tabs)/interpretations" },
  { label: "Feedback", path: "/(tabs)/feedback" },
] as const;

interface AppHeaderProps {
  showRibbon?: boolean;
}

export function AppHeader({ showRibbon = true }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width < 720;

  const padX = isMobile ? LAYOUT.pagePadXMobile : LAYOUT.pagePadX;

  return (
    <View
      style={{
        backgroundColor: PALETTE.background,
        borderBottomWidth: 1,
        borderBottomColor: PALETTE.divider,
      }}
    >
      <View
        style={{
          height: LAYOUT.headerHeight,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: padX,
          maxWidth: LAYOUT.maxWidth,
          width: "100%",
          alignSelf: "center",
        }}
      >
        {/* Logo */}
        <Pressable
          onPress={() => router.replace("/(tabs)/map")}
          style={{ flexDirection: "row", alignItems: "center" }}
        >
          <Image
            source={require("../../assets/shadonis-logo.png")}
            style={{ width: 36, height: 36, resizeMode: "contain" }}
          />
          {!isMobile && (
            <Text
              style={{
                fontFamily: FONTS.display,
                fontSize: 18,
                marginLeft: 12,
                color: PALETTE.textPrimary,
                letterSpacing: 4,
                textTransform: "uppercase",
              }}
            >
              Shadonis
            </Text>
          )}
        </Pressable>

        {/* Nav tabs */}
        <View
          style={{
            flex: 1,
            flexDirection: "row",
            justifyContent: "center",
            gap: isMobile ? 16 : 36,
          }}
        >
          {TABS.map((tab) => {
            const active = pathname?.includes(tab.path.split("/").pop()!);
            return (
              <Pressable
                key={tab.path}
                onPress={() => router.replace(tab.path as any)}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: 1.5,
                  borderBottomColor: active ? PALETTE.accent : "transparent",
                }}
              >
                <Text
                  style={{
                    ...TYPE.navTab,
                    color: active ? PALETTE.accent : PALETTE.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={() => router.push("/(tabs)/profile")}
          style={{ padding: 6 }}
          hitSlop={8}
        >
          <Settings color={PALETTE.textTertiary} size={16} />
        </Pressable>
      </View>

      {showRibbon && <PlanetRibbon padX={padX} />}
    </View>
  );
}

function PlanetRibbon({ padX }: { padX: number }) {
  const ribbonName = useUserStore((s) => s.name) ?? MOCK_CHART.name;
  const livePositions = useUserStore((s) => s.natalPositions);

  // Build the displayed planet rows from live data when available, else
  // fall back to the on-brand mock so the ribbon never looks empty.
  const rows = livePositions
    ? livePositions
        .filter((p) => p.planet !== null)
        .map((p) => ({
          planet: p.planet!,
          degree: p.degree,
          minute: p.minute,
          signGlyph: p.signGlyph,
          retrograde: p.retrograde,
        }))
    : MOCK_CHART.positions.map((p) => ({
        planet: p.planet,
        degree: p.degree,
        minute: p.minute,
        signGlyph: p.signGlyph,
        retrograde: !!p.retrograde,
      }));

  return (
    <View
      style={{
        backgroundColor: PALETTE.backgroundAlt,
        borderTopWidth: 1,
        borderTopColor: PALETTE.divider,
        height: LAYOUT.ribbonHeight,
        justifyContent: "center",
      }}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: padX,
          alignItems: "center",
          gap: 22,
        }}
      >
        <Text
          style={{
            ...TYPE.sectionLabel,
            color: PALETTE.accentSoft,
            marginRight: 8,
          }}
        >
          {`${ribbonName} · Natal`}
        </Text>
        {rows.map((pos) => {
          const meta = PLANETS[pos.planet];
          return (
            <View
              key={pos.planet}
              style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
            >
              <Text style={{ color: meta.color, fontSize: 14, lineHeight: 16 }}>
                {meta.glyph}
              </Text>
              <Text style={{ ...TYPE.data, color: PALETTE.textSecondary }}>
                {`${String(pos.degree).padStart(2, "0")}°${String(pos.minute).padStart(2, "0")}′`}
              </Text>
              <Text style={{ ...TYPE.data, color: PALETTE.textTertiary }}>
                {pos.signGlyph}
              </Text>
              {pos.retrograde && (
                <Text style={{ ...TYPE.small, color: PALETTE.textTertiary }}>
                  R
                </Text>
              )}
            </View>
          );
        })}
        <View style={{ width: SPACING.lg }} />
      </ScrollView>
    </View>
  );
}
