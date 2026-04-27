import React, { ReactNode } from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import {
  PALETTE,
  TYPE,
  LAYOUT,
  SPACING,
  RADIUS,
  GLOW,
} from "../../constants/designSystem";

interface PageProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  scroll?: boolean;
  fullBleed?: boolean;
}

export function Page({
  title,
  subtitle,
  children,
  scroll = true,
  fullBleed = false,
}: PageProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 720;
  const padX = isMobile ? LAYOUT.pagePadXMobile : LAYOUT.pagePadX;

  const Container: any = scroll ? ScrollView : View;
  const containerProps = scroll
    ? {
        showsVerticalScrollIndicator: false,
        contentContainerStyle: { paddingBottom: SPACING.xxxl },
      }
    : { style: { flex: 1 } };

  return (
    <Container
      style={[
        { flex: 1, backgroundColor: "transparent" },
        scroll ? undefined : { flex: 1 },
      ]}
      {...containerProps}
    >
      <View
        style={{
          flex: 1,
          width: "100%",
          maxWidth: fullBleed ? undefined : LAYOUT.maxWidth,
          alignSelf: "center",
          paddingHorizontal: fullBleed ? 0 : padX,
          paddingTop: SPACING.xxl,
        }}
      >
        {title && (
          <Text
            style={[
              TYPE.pageTitle,
              { marginBottom: subtitle ? SPACING.sm : SPACING.lg, textAlign: "center" },
            ]}
          >
            {title}
          </Text>
        )}
        {subtitle && (
          <Text
            style={[
              TYPE.pageSubtitle,
              {
                marginBottom: SPACING.xxl,
                maxWidth: 640,
                textAlign: "center",
                alignSelf: "center",
              },
            ]}
          >
            {subtitle}
          </Text>
        )}
        {children}
      </View>
    </Container>
  );
}

interface SectionProps {
  label?: string;
  children: ReactNode;
  style?: any;
}

export function Section({ label, children, style }: SectionProps) {
  return (
    <View style={[{ marginTop: SPACING.xl }, style]}>
      {label && (
        <Text
          style={[
            TYPE.sectionLabel,
            { marginBottom: SPACING.md, textAlign: "center" },
          ]}
        >
          {label}
        </Text>
      )}
      {children}
    </View>
  );
}

interface CardProps {
  children: ReactNode;
  style?: any;
  borderColor?: string;
  glow?: boolean;
}

export function Card({ children, style, borderColor, glow = true }: CardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: PALETTE.surface,
          borderWidth: 1.5,
          borderColor: borderColor ?? PALETTE.surfaceBorder,
          borderRadius: RADIUS.xl,
          padding: SPACING.lg,
          ...(glow ? ({ boxShadow: GLOW.pinkSoft } as any) : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
