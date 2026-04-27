import React, { useState } from "react";
import { View, Text, Pressable, LayoutAnimation, Platform, UIManager } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { Page, Section } from "../../components/ui/Page";
import { PALETTE, TYPE, SPACING } from "../../constants/designSystem";
import { PLANETS, ANGLES } from "../../constants/planets";
import { STATIC_INTERPRETATIONS } from "../../constants/interpretations";
import { Planet, Angle } from "../../types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ANGLE_ORDER: Angle[] = ["asc", "ic", "dsc", "mc"];

export default function ReadingsScreen() {
  const [expanded, setExpanded] = useState<Planet | null>(null);

  function toggle(p: Planet) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((cur) => (cur === p ? null : p));
  }

  const planets = Object.keys(PLANETS) as Planet[];

  return (
    <Page
      title="Readings"
      subtitle="Planetary interpretations by Shadonis. Tap a planet to read how each angle expresses through it."
    >
      <Section>
        <View>
          {planets.map((planet) => {
            const meta = PLANETS[planet];
            const isOpen = expanded === planet;
            const interps = STATIC_INTERPRETATIONS.filter((i) => i.planet === planet);

            return (
              <View
                key={planet}
                style={{
                  borderTopWidth: 1,
                  borderTopColor: PALETTE.divider,
                  borderLeftWidth: 2,
                  borderLeftColor: isOpen ? meta.color : "transparent",
                }}
              >
                <Pressable
                  onPress={() => toggle(planet)}
                  style={(state: any) => ({
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: SPACING.lg,
                    paddingHorizontal: SPACING.md,
                    backgroundColor: state.hovered ? PALETTE.accentMuted : "transparent",
                  })}
                >
                  <Text
                    style={{
                      color: meta.color,
                      fontSize: 22,
                      width: 36,
                      textAlign: "center",
                    }}
                  >
                    {meta.glyph}
                  </Text>
                  <View style={{ flex: 1, marginLeft: SPACING.md }}>
                    <Text style={TYPE.cardTitle}>{meta.displayName}</Text>
                    <Text style={[TYPE.body, { marginTop: 2 }]}>
                      {meta.description}
                    </Text>
                  </View>
                  <ChevronDown
                    color={PALETTE.textTertiary}
                    size={16}
                    style={{
                      transform: [{ rotate: isOpen ? "180deg" : "0deg" }],
                    }}
                  />
                </Pressable>

                {isOpen && (
                  <View
                    style={{
                      paddingHorizontal: SPACING.lg,
                      paddingBottom: SPACING.xl,
                    }}
                  >
                    {interps.length === 0 ? (
                      <Text style={[TYPE.smallItalic, { paddingVertical: SPACING.md }]}>
                        Readings for {meta.displayName} are being written.
                      </Text>
                    ) : (
                      ANGLE_ORDER.filter((a) => interps.find((i) => i.angle === a)).map(
                        (a) => {
                          const interp = interps.find((i) => i.angle === a)!;
                          return (
                            <View key={a} style={{ marginTop: SPACING.lg }}>
                              <Text
                                style={[
                                  TYPE.sectionLabel,
                                  { color: meta.color, marginBottom: SPACING.sm },
                                ]}
                              >
                                {ANGLES[a].displayName}
                              </Text>
                              <Text
                                style={[
                                  TYPE.cardTitleItalic,
                                  { fontSize: 18, marginBottom: SPACING.sm },
                                ]}
                              >
                                {interp.shortTheme}
                              </Text>
                              <Text style={[TYPE.body, { color: PALETTE.textPrimary }]}>
                                {interp.whatItFeelsLike}
                              </Text>
                              <View style={{ marginTop: SPACING.md }}>
                                <Text style={TYPE.sectionLabel}>Best use</Text>
                                <Text style={[TYPE.body, { marginTop: 4 }]}>
                                  {interp.bestUseCases}
                                </Text>
                              </View>
                              <View style={{ marginTop: SPACING.md }}>
                                <Text style={TYPE.sectionLabel}>Watch out</Text>
                                <Text style={[TYPE.body, { marginTop: 4 }]}>
                                  {interp.watchOuts}
                                </Text>
                              </View>
                            </View>
                          );
                        }
                      )
                    )}
                  </View>
                )}
              </View>
            );
          })}
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: PALETTE.divider,
            }}
          />
        </View>
      </Section>
    </Page>
  );
}
