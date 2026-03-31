import React, { useState } from "react";
import { View, TextInput, Text, TextInputProps } from "react-native";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const borderClass = error
    ? "border-danger"
    : isFocused
    ? "border-gold"
    : "border-surface-light";

  return (
    <View className="w-full">
      {label && (
        <Text className="text-cream font-inter-medium text-sm mb-2">
          {label}
        </Text>
      )}
      <TextInput
        className={`bg-surface border-2 ${borderClass} rounded-xl px-4 py-3.5 text-cream font-inter text-base`}
        placeholderTextColor="#B8B2A8"
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      {error && (
        <Text className="text-danger text-xs font-inter mt-1">{error}</Text>
      )}
      {hint && !error && (
        <Text className="text-cream-muted text-xs font-inter mt-1">
          {hint}
        </Text>
      )}
    </View>
  );
}
