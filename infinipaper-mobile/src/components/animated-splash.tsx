import { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BrandMark } from "./brand-mark";
import { fonts, primitives, spacing } from "../theme";

export function AnimatedSplash({ onFinish }: { onFinish: () => void }) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [scale] = useState(() => new Animated.Value(0.82));
  const [glow] = useState(() => new Animated.Value(0.35));

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
        Animated.timing(glow, {
          toValue: 1,
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
  }, [glow, onFinish, opacity, scale]);

  return (
    <Animated.View style={[styles.overlay, { opacity }]} pointerEvents="none">
      <LinearGradient
        colors={["#FAF6EE", "#F3ECDD", "#FFFFFF"]}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[styles.glow, { opacity: glow }]} />
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={styles.markWrap}>
          <BrandMark size={118} />
        </View>
        <Text style={styles.wordmark}>Infinipaper</Text>
        <Text style={styles.tagline}>Tu estudio, en orden.</Text>
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
  glow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: primitives.indigoSoft,
    opacity: 0.5,
  },
  markWrap: {
    alignSelf: "center",
    width: 154,
    height: 154,
    borderRadius: 77,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(75,46,163,0.12)",
    shadowColor: primitives.indigo,
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 14 },
  },
  wordmark: {
    marginTop: spacing.lg,
    textAlign: "center",
    fontFamily: fonts.heading,
    fontSize: 34,
    color: primitives.ink,
    letterSpacing: -0.5,
  },
  tagline: {
    marginTop: spacing.xs,
    textAlign: "center",
    fontFamily: fonts.regular,
    fontSize: 14,
    color: primitives.muted,
    letterSpacing: 0.2,
  },
});
