import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { PALETTE, TYPE, SPACING, RADIUS } from "../../constants/designSystem";
import {
  PlaceSuggestion,
  ResolvedPlace,
  searchPlaces,
  resolvePlace,
} from "../../services/places";

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onResolve: (place: ResolvedPlace) => void;
  placeholder?: string;
}

export function PlaceAutocomplete({
  value,
  onChangeText,
  onResolve,
  placeholder = "Where were you born?",
}: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [resolving, setResolving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // True for one render cycle right after the user picks a suggestion.
  // The value-change-driven search useEffect skips its work for that
  // tick, so the dropdown doesn't reopen with the freshly-resolved
  // city as the new query (which is what was forcing a second tap).
  const justPickedRef = useRef(false);

  // Set on touch-down inside a suggestion. Used to keep the dropdown
  // alive past the input's blur event so the press can complete.
  const pressingRef = useRef(false);

  useEffect(() => {
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchPlaces(value);
        setSuggestions(results);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  async function handlePick(s: PlaceSuggestion) {
    // Suppress the next value-driven search triggered by setting the
    // input to the resolved full name.
    justPickedRef.current = true;
    setResolving(true);
    try {
      const place = await resolvePlace(s);
      onChangeText(place.fullName);
      setOpen(false);
      setSuggestions([]);
      onResolve(place);
    } catch {
      // swallow — user can pick another
    } finally {
      pressingRef.current = false;
      setResolving(false);
    }
  }

  return (
    <View style={{ position: "relative" }}>
      <TextInput
        value={value}
        onChangeText={(t) => {
          // User is actively typing — re-enable searching and clear the
          // just-picked guard so subsequent edits do trigger results.
          justPickedRef.current = false;
          onChangeText(t);
          setOpen(true);
        }}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => {
          // Let any in-flight press finish before closing.
          setTimeout(() => {
            if (!pressingRef.current) setOpen(false);
          }, 280);
        }}
        placeholder={placeholder}
        placeholderTextColor={PALETTE.textTertiary}
        autoCorrect={false}
        autoCapitalize="words"
        style={{
          borderBottomWidth: 1,
          borderBottomColor: PALETTE.surfaceBorderStrong,
          paddingVertical: SPACING.sm,
          color: PALETTE.textPrimary,
          fontFamily: "Inter_400Regular",
          fontSize: 16,
        }}
      />

      {(loading || resolving) && (
        <View
          style={{
            position: "absolute",
            right: 0,
            top: SPACING.md,
          }}
        >
          <ActivityIndicator size="small" color={PALETTE.textTertiary} />
        </View>
      )}

      {open && suggestions.length > 0 && (
        <View
          style={{
            position: "absolute",
            top: 48,
            left: 0,
            right: 0,
            backgroundColor: PALETTE.surface,
            borderWidth: 1,
            borderColor: PALETTE.surfaceBorderStrong,
            borderRadius: RADIUS.md,
            paddingVertical: SPACING.xs,
            zIndex: 50,
            ...({ boxShadow: "0 6px 24px rgba(0,0,0,0.6)" } as any),
          }}
        >
          {suggestions.slice(0, 6).map((s) => (
            <Pressable
              key={s.id}
              // onPressIn fires on touch-down (web: mousedown / touchstart),
              // *before* the input's blur event. Doing the work here
              // sidesteps the blur-closes-dropdown-before-press race that
              // was forcing users to tap a suggestion twice.
              onPressIn={() => {
                pressingRef.current = true;
                handlePick(s);
              }}
              onPress={() => {
                // Fallback for runtimes that fire onPress without onPressIn.
                if (!pressingRef.current) handlePick(s);
              }}
              style={(state: any) => ({
                paddingVertical: SPACING.sm + 2,
                paddingHorizontal: SPACING.md,
                backgroundColor: state.hovered || state.pressed
                  ? PALETTE.accentMuted
                  : "transparent",
              })}
            >
              <Text style={[TYPE.bodyPrimary, { fontSize: 15 }]}>
                {s.primaryText}
              </Text>
              {s.secondaryText ? (
                <Text style={TYPE.small}>{s.secondaryText}</Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
