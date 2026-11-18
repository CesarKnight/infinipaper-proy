import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BrandMark } from "./brand-mark";
import { fonts, spacing, useAppTheme } from "../theme";

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const { colors, gradients } = useAppTheme();
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.82));

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 12,
          stiffness: 90,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(550),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.06,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onFinish();
    });
  }, [onFinish, opacity, scale]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <LinearGradient colors={gradients} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.content, { transform: [{ scale }] }]}>
        <BrandMark size={118} />
        <Text style={[styles.wordmark, { color: colors.foreground }]}>
          Infinipaper
        </Text>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          Tu estudio, en orden.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 100,
  },
  content: {
    alignItems: "center",
  },
  wordmark: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontFamily: fonts.heading,
    fontSize: 34,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.xs,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
