import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRightIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "../../components/brand-mark";
import { Field, PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { fonts, primitives, radius, spacing, useAppTheme } from "../../theme";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!identifier.trim() || !password) {
      setError("Escribe tu correo o usuario y tu contraseña.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await login(identifier.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={["#FAF6EE", "#F3ECDD", "#FFFFFF"]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.mark}>
              <BrandMark size={72} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Vuelve a tu estudio.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Organiza cursos, apuntes y evaluaciones desde donde estés.
            </Text>
          </View>

          <View style={[styles.panel, { backgroundColor: "rgba(255,255,255,0.76)", borderColor: colors.border }]}>
            <Field
              label="Correo o usuario"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="ana@universidad.edu"
              value={identifier}
              onChangeText={setIdentifier}
            />
            <Field
              label="Contraseña"
              secureTextEntry
              placeholder="Tu contraseña"
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            <PrimaryButton
              label={loading ? "Entrando…" : "Entrar"}
              onPress={submit}
              loading={loading}
              icon={<ArrowRightIcon size={18} color={primitives.white} />}
            />
            <View style={styles.links}>
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>¿Primera vez aquí?</Text>
              <Link href="/(auth)/register" asChild>
                <Pressable>
                  <Text style={[styles.link, { color: colors.primary }]}>Crea tu cuenta</Text>
                </Pressable>
              </Link>
            </View>
          </View>
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            Paper & Ink · Midnight Study
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing["2xl"],
    gap: spacing["2xl"],
  },
  hero: { alignItems: "center", gap: spacing.sm },
  mark: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1,
    borderColor: "rgba(75,46,163,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    shadowColor: primitives.indigo,
    shadowOpacity: 0.15,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
  },
  title: { fontFamily: fonts.heading, fontSize: 30, textAlign: "center", letterSpacing: -0.5 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 300 },
  panel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    shadowColor: primitives.ink,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  links: { flexDirection: "row", justifyContent: "center", gap: spacing.xs, flexWrap: "wrap" },
  helper: { fontFamily: fonts.regular, fontSize: 13 },
  link: { fontFamily: fonts.semibold, fontSize: 13 },
  footer: { fontFamily: fonts.regular, fontSize: 11, textAlign: "center", letterSpacing: 1.4 },
});
