import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "./brand-mark";
import { useAuth } from "../lib/auth";
import { fonts, radius, spacing, useAppTheme } from "../theme";

export function TopBar({ title, subtitle }: { title?: string; subtitle?: string }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const initials = (user?.displayName ?? "IP")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: colors.background }}>
      <View style={styles.bar}>
        <View style={styles.brand}>
          <View style={[styles.mark, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <BrandMark size={30} />
          </View>
          <View>
            <Text style={[styles.wordmark, { color: colors.foreground }]}>Infinipaper</Text>
            {title ? (
              <Text style={[styles.title, { color: colors.mutedForeground }]}>
                {title}{subtitle ? ` · ${subtitle}` : ""}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.initials, { color: colors.primaryForeground }]}>{initials}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 62,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  mark: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontFamily: fonts.heading,
    fontSize: 20,
    letterSpacing: -0.3,
  },
  title: {
    fontFamily: fonts.regular,
    fontSize: 11,
    marginTop: 2,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontFamily: fonts.semibold, fontSize: 12 },
});
