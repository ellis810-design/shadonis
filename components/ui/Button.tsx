import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
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
  fullWidth = true,
}: ButtonProps) {
  const baseClasses = "items-center justify-center rounded-xl";
  const widthClass = fullWidth ? "w-full" : "";

  const sizeClasses = {
    sm: "py-2 px-4",
    md: "py-3.5 px-6",
    lg: "py-4 px-8",
  };

  const variantClasses = {
    primary: "bg-gold",
    secondary: "bg-purple",
    outline: "bg-transparent border-2 border-gold",
    ghost: "bg-transparent",
  };

  const textVariantClasses = {
    primary: "text-background font-inter-bold",
    secondary: "text-cream font-inter-bold",
    outline: "text-gold font-inter-semibold",
    ghost: "text-gold font-inter-semibold",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`${baseClasses} ${widthClass} ${sizeClasses[size]} ${variantClasses[variant]} ${isDisabled ? "opacity-50" : "opacity-100"}`}
      style={style}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#0B0D17" : "#C9A84C"}
          size="small"
        />
      ) : (
        <Text
          className={`${textVariantClasses[variant]} ${textSizeClasses[size]}`}
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
