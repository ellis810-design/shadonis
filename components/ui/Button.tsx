import React from "react";
import {
  Pressable,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  PALETTE,
  TYPE,
  SPACING,
  RADIUS,
  GLOW,
} from "../../constants/designSystem";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const padY = size === "sm" ? 9 : 13;
  const padX = size === "sm" ? SPACING.lg : SPACING.xl + 4;

  const variantStyle: ViewStyle = (() => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: PALETTE.cyan,
          borderWidth: 0,
          ...({ boxShadow: GLOW.cyanSoft } as any),
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: PALETTE.accent,
          ...({ boxShadow: GLOW.pinkSoft } as any),
        };
      case "ghost":
        return { backgroundColor: "transparent", borderWidth: 0 };
    }
  })();

  const variantText: TextStyle = (() => {
    switch (variant) {
      case "primary":
        return { color: PALETTE.background };
      case "outline":
      case "ghost":
        return { color: PALETTE.accent };
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={(state: any) => [
        {
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: padY,
          paddingHorizontal: padX,
          borderRadius: RADIUS.pill,
          alignSelf: fullWidth ? "stretch" : "flex-start",
          opacity: isDisabled ? 0.45 : state.pressed ? 0.85 : 1,
        },
        variantStyle,
        state.hovered && variant === "primary" && { backgroundColor: PALETTE.cyanBright },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? PALETTE.background : PALETTE.accent}
          size="small"
        />
      ) : (
        <Text style={[TYPE.buttonLabel, variantText, textStyle]}>{title}</Text>
      )}
    </Pressable>
  );
}
