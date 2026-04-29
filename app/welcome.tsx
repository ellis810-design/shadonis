import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/ui/Button";
import { PlaceAutocomplete } from "../components/ui/PlaceAutocomplete";
import { useUserStore } from "../stores/userStore";
import { ensureTimezone, ResolvedPlace } from "../services/places";
import { getNatalPositions } from "../services/astrology";
import { parseLocalDate, parseLocalDateTime } from "../services/dateUtils";
import {
  PALETTE,
  TYPE,
  SPACING,
  RADIUS,
  LAYOUT,
} from "../constants/designSystem";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

function Field({ label, children, hint }: FieldProps) {
  return (
    <View style={{ marginBottom: SPACING.xl }}>
      <Text style={[TYPE.sectionLabel, { marginBottom: SPACING.sm }]}>
        {label}
      </Text>
      {children}
      {hint && <Text style={[TYPE.small, { marginTop: 6 }]}>{hint}</Text>}
    </View>
  );
}

function lineInputStyle() {
  return {
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.surfaceBorderStrong,
    paddingVertical: SPACING.sm,
    color: PALETTE.textPrimary,
    fontFamily: "Inter_400Regular",
    fontSize: 16,
  } as const;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const setName = useUserStore((s) => s.setName);
  const setNatalPositions = useUserStore((s) => s.setNatalPositions);

  const { width } = useWindowDimensions();
  const padX = width < 720 ? LAYOUT.pagePadXMobile : LAYOUT.pagePadX;

  const [name, setNameLocal] = useState("");
  const [month, setMonth] = useState<number | null>(null);
  const [day, setDay] = useState<string>("");
  const [year, setYear] = useState<string>("");
  const [hour12, setHour12] = useState<string>("");      // 1-12
  const [minute, setMinute] = useState<string>("");
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeText, setPlaceText] = useState("");
  const [resolvedPlace, setResolvedPlace] = useState<ResolvedPlace | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): string | null {
    if (!name.trim()) return "Please share your name.";
    if (month == null || !day || !year) return "Please enter your full birth date.";
    const d = parseInt(day, 10);
    const y = parseInt(year, 10);
    if (Number.isNaN(d) || d < 1 || d > 31) return "Day looks off.";
    if (Number.isNaN(y) || y < 1900 || y > new Date().getFullYear())
      return "Year looks off.";
    if (!timeUnknown) {
      const h = parseInt(hour12, 10);
      const m = parseInt(minute, 10);
      if (Number.isNaN(h) || h < 1 || h > 12) return "Hour should be 1–12.";
      if (Number.isNaN(m) || m < 0 || m > 59) return "Minute should be 00–59.";
    }
    if (!resolvedPlace) {
      return "Please select your birth place from the suggestions.";
    }
    return null;
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      // Convert 12-hour + meridiem to 24-hour for storage.
      let hour24 = 0;
      let minutesNum = 0;
      if (!timeUnknown) {
        const h = parseInt(hour12, 10);
        minutesNum = parseInt(minute, 10);
        hour24 = h % 12;
        if (meridiem === "PM") hour24 += 12;
      }

      const birthDateStr = `${year}-${pad((month ?? 0) + 1)}-${pad(parseInt(day, 10))}`;
      const birthTimeStr = timeUnknown
        ? null
        : `${pad(hour24)}:${pad(minutesNum)}:00`;

      // Make sure we have a timezone (Nominatim doesn't return one).
      const placeWithTz = await ensureTimezone(resolvedPlace!);

      setName(name.trim());
      setUser({
        id: `local-${Date.now()}`,
        birthDate: birthDateStr,
        birthTime: birthTimeStr,
        birthTimeUnknown: timeUnknown,
        birthCity: placeWithTz.shortName,
        birthCountryCode: placeWithTz.countryCode || "US",
        birthLat: placeWithTz.lat,
        birthLng: placeWithTz.lng,
        birthTimezone: placeWithTz.timezone,
        subscriptionTier: "free",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Fetch real natal positions (tropical zodiac, Swiss Ephemeris).
      // Failure here shouldn't block landing on the map — we'll just retry
      // on the map page with the same call.
      try {
        const positions = await getNatalPositions(
          parseLocalDate(birthDateStr),
          birthTimeStr
            ? parseLocalDateTime("2000-01-01", birthTimeStr)
            : null,
          placeWithTz.lat,
          placeWithTz.lng,
          placeWithTz.shortName,
          placeWithTz.countryCode || "US",
          placeWithTz.timezone,
        );
        setNatalPositions(positions);
      } catch (e) {
        console.warn("[welcome] Natal positions fetch failed:", e);
      }

      // Land on Profile so the participant sees their natal chart
      // confirmation first, then explores the map from there.
      router.replace("/(tabs)/profile");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong casting your chart."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PALETTE.background }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: SPACING.xxxl }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: padX,
            paddingTop: SPACING.xxl,
            maxWidth: 560,
            width: "100%",
            alignSelf: "center",
          }}
        >
          <View style={{ alignItems: "center", marginBottom: SPACING.xl }}>
            <Image
              source={require("../assets/shadonis-logo.png")}
              style={{
                width: 76,
                height: 76,
                resizeMode: "contain",
                marginBottom: SPACING.lg,
              }}
            />

            {/* Wordmark — uses the brand image so the planet + nebula
                composition reads as one continuous starfield with the
                page bg. Soft mask via radial fade on the bottom edge
                hides the seam between the image and the body copy. */}
            <View
              style={{
                width: "100%",
                maxWidth: 520,
                aspectRatio: 1280 / 720,
                marginBottom: SPACING.md,
                borderRadius: RADIUS.lg,
                overflow: "hidden",
                ...({
                  boxShadow:
                    "0 0 60px rgba(255, 93, 168, 0.35), 0 0 120px rgba(127, 231, 229, 0.15)",
                  maskImage:
                    "radial-gradient(ellipse 100% 80% at 50% 50%, #000 60%, transparent 100%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 100% 80% at 50% 50%, #000 60%, transparent 100%)",
                } as any),
              }}
            >
              <Image
                source={require("../assets/shadonis-wordmark.png")}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "cover",
                }}
                accessibilityLabel="Shadonis"
              />
            </View>
          </View>

          <Text
            style={[
              TYPE.pageTitle,
              { fontSize: 32, lineHeight: 40, textAlign: "center" },
            ]}
          >
            {"Hi Star, Let’s pull your chart"}
          </Text>
          <Text
            style={[
              TYPE.pageSubtitle,
              {
                marginTop: SPACING.sm,
                fontSize: 15,
                lineHeight: 24,
                marginBottom: SPACING.xxl,
                textAlign: "center",
              },
            ]}
          >
            Enter the moment and place of your birth. Everything stays on this device.
          </Text>

          {/* Name */}
          <Field label="Name">
            <TextInput
              value={name}
              onChangeText={setNameLocal}
              placeholder="What should we call you?"
              placeholderTextColor={PALETTE.textTertiary}
              autoCapitalize="words"
              style={lineInputStyle()}
            />
          </Field>

          {/* Date */}
          <Field label="Date of birth">
            <View style={{ flexDirection: "row", gap: SPACING.md }}>
              <View style={{ flex: 1.6 }}>
                <MonthSelect value={month} onChange={setMonth} />
              </View>
              <View style={{ flex: 0.7 }}>
                <TextInput
                  value={day}
                  onChangeText={(t) => setDay(t.replace(/[^0-9]/g, "").slice(0, 2))}
                  placeholder="Day"
                  placeholderTextColor={PALETTE.textTertiary}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  style={lineInputStyle()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={year}
                  onChangeText={(t) => setYear(t.replace(/[^0-9]/g, "").slice(0, 4))}
                  placeholder="Year"
                  placeholderTextColor={PALETTE.textTertiary}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  style={lineInputStyle()}
                />
              </View>
            </View>
          </Field>

          {/* Time */}
          <Field
            label="Time of birth"
            hint={"If you don’t know your exact time, tick the box below — we’ll use noon."}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: SPACING.md,
                opacity: timeUnknown ? 0.4 : 1,
              }}
            >
              <View style={{ flex: 1 }}>
                <TextInput
                  value={hour12}
                  onChangeText={(t) =>
                    setHour12(t.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  placeholder="HH"
                  placeholderTextColor={PALETTE.textTertiary}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  editable={!timeUnknown}
                  style={lineInputStyle()}
                />
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={minute}
                  onChangeText={(t) =>
                    setMinute(t.replace(/[^0-9]/g, "").slice(0, 2))
                  }
                  placeholder="MM"
                  placeholderTextColor={PALETTE.textTertiary}
                  keyboardType="number-pad"
                  inputMode="numeric"
                  editable={!timeUnknown}
                  style={lineInputStyle()}
                />
              </View>
              <MeridiemToggle
                value={meridiem}
                onChange={setMeridiem}
                disabled={timeUnknown}
              />
            </View>

            <Pressable
              onPress={() => setTimeUnknown((v) => !v)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: SPACING.md,
              }}
              hitSlop={6}
            >
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderWidth: 1,
                  borderColor: timeUnknown ? PALETTE.accent : PALETTE.surfaceBorderStrong,
                  backgroundColor: timeUnknown ? PALETTE.accent : "transparent",
                  borderRadius: 2,
                  marginRight: SPACING.sm,
                }}
              />
              <Text style={[TYPE.small, { color: PALETTE.textSecondary }]}>
                {"I don’t know my birth time"}
              </Text>
            </Pressable>
          </Field>

          {/* Place */}
          <Field
            label="Place of birth"
            hint={"Start typing a city — suggestions come from Google Maps / OpenStreetMap."}
          >
            <PlaceAutocomplete
              value={placeText}
              onChangeText={(t) => {
                setPlaceText(t);
                if (resolvedPlace && t !== resolvedPlace.fullName) {
                  setResolvedPlace(null);
                }
              }}
              onResolve={(p) => {
                setResolvedPlace(p);
                setPlaceText(p.fullName);
              }}
              placeholder="City, region, country"
            />
          </Field>

          {error && (
            <Text
              style={[
                TYPE.small,
                { color: PALETTE.danger, marginBottom: SPACING.md },
              ]}
            >
              {error}
            </Text>
          )}

          <View style={{ marginTop: SPACING.lg }}>
            <Button
              title={submitting ? "Pulling…" : "Pull chart"}
              onPress={handleSubmit}
              loading={submitting}
              fullWidth
            />
          </View>

          <Text
            style={[
              TYPE.smallItalic,
              {
                color: PALETTE.textTertiary,
                marginTop: SPACING.xl,
                textAlign: "center",
              },
            ]}
          >
            {"Everything runs in your browser — your birth details never leave this device."}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------- Month select: native <select> on web, custom on native ---------- */

interface MonthSelectProps {
  value: number | null;
  onChange: (v: number) => void;
}

function MonthSelect({ value, onChange }: MonthSelectProps) {
  if (Platform.OS === "web") return <MonthSelectWeb value={value} onChange={onChange} />;
  return <MonthSelectNative value={value} onChange={onChange} />;
}

function MonthSelectWeb({ value, onChange }: MonthSelectProps) {
  // Use a real <select> so the browser handles scrolling + keyboard nav.
  const SelectEl = "select" as unknown as React.ComponentType<any>;
  const OptionEl = "option" as unknown as React.ComponentType<any>;

  return (
    <View style={{ position: "relative" }}>
      <SelectEl
        value={value == null ? "" : String(value)}
        onChange={(e: any) => {
          const v = e.target.value;
          if (v === "") return;
          onChange(parseInt(v, 10));
        }}
        style={{
          width: "100%",
          background: "transparent",
          color: value == null ? PALETTE.textTertiary : PALETTE.textPrimary,
          border: "none",
          borderBottom: `1px solid ${PALETTE.surfaceBorderStrong}`,
          paddingTop: SPACING.sm,
          paddingBottom: SPACING.sm,
          paddingLeft: 0,
          paddingRight: 0,
          fontFamily: "Inter_400Regular, sans-serif",
          fontSize: 16,
          appearance: "none",
          cursor: "pointer",
          outline: "none",
        }}
      >
        <OptionEl value="" disabled style={{ color: "#000" }}>
          Month
        </OptionEl>
        {MONTHS.map((m, i) => (
          <OptionEl key={m} value={String(i)} style={{ color: "#000" }}>
            {m}
          </OptionEl>
        ))}
      </SelectEl>
    </View>
  );
}

function MonthSelectNative({ value, onChange }: MonthSelectProps) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        style={[lineInputStyle(), { justifyContent: "center", minHeight: 36 } as any]}
      >
        <Text
          style={{
            color: value == null ? PALETTE.textTertiary : PALETTE.textPrimary,
            fontFamily: "Inter_400Regular",
            fontSize: 16,
          }}
        >
          {value == null ? "Month" : MONTHS[value]}
        </Text>
      </Pressable>
      {open && (
        <View
          style={{
            position: "absolute",
            top: 44,
            left: 0,
            right: 0,
            backgroundColor: PALETTE.surface,
            borderWidth: 1,
            borderColor: PALETTE.surfaceBorderStrong,
            borderRadius: RADIUS.md,
            paddingVertical: SPACING.xs,
            zIndex: 40,
            maxHeight: 260,
            overflow: "hidden",
          }}
        >
          <ScrollView>
            {MONTHS.map((m, i) => (
              <Pressable
                key={m}
                onPress={() => {
                  onChange(i);
                  setOpen(false);
                }}
                style={{ paddingVertical: 10, paddingHorizontal: SPACING.md }}
              >
                <Text
                  style={{
                    color: PALETTE.textPrimary,
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                  }}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

/* ---------- AM / PM segmented toggle ---------- */

interface MeridiemToggleProps {
  value: "AM" | "PM";
  onChange: (v: "AM" | "PM") => void;
  disabled?: boolean;
}

function MeridiemToggle({ value, onChange, disabled }: MeridiemToggleProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        borderWidth: 1,
        borderColor: PALETTE.surfaceBorderStrong,
        borderRadius: RADIUS.md,
        overflow: "hidden",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {(["AM", "PM"] as const).map((m, idx) => {
        const active = value === m;
        return (
          <Pressable
            key={m}
            onPress={() => !disabled && onChange(m)}
            disabled={disabled}
            style={{
              paddingHorizontal: SPACING.md,
              paddingVertical: 10,
              backgroundColor: active ? PALETTE.accent : "transparent",
              borderLeftWidth: idx === 0 ? 0 : 1,
              borderLeftColor: PALETTE.surfaceBorderStrong,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 12,
                letterSpacing: 1.6,
                color: active ? PALETTE.background : PALETTE.textSecondary,
              }}
            >
              {m}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
