import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRightIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BrandMark } from "../../components/brand-mark";
import { Field, PrimaryButton } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { fonts, radius, spacing, useAppTheme } from "../../theme";

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { colors, gradients, isDark } = useAppTheme();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!username.trim() || !email.trim() || !displayName.trim() || password.length < 8) {
      setError("Completa todos los campos. La contraseña necesita al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        displayName: displayName.trim(),
        password,
      });
      router.replace("/(tabs)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient colors={gradients} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.mark}>
              <BrandMark size={62} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Empieza con buen pie.</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Tu espacio para aprender, ordenar y compartir material académico.
            </Text>
          </View>

          <View style={[styles.panel, {
            backgroundColor: colors.card,
            borderColor: colors.border,
            shadowColor: isDark ? "#000000" : colors.foreground,
            shadowOpacity: isDark ? 0.35 : 0.1,
          }]}>
            <Field label="Nombre visible" placeholder="Ana Torres" value={displayName} onChangeText={setDisplayName} />
            <Field
              label="Usuario"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="ana"
              value={username}
              onChangeText={setUsername}
            />
            <Field
              label="Correo"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="ana@universidad.edu"
              value={email}
              onChangeText={setEmail}
            />
            <Field
              label="Contraseña"
              secureTextEntry
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChangeText={setPassword}
            />
            {error ? <Text style={[styles.error, { color: colors.danger }]}>{error}</Text> : null}
            <PrimaryButton
              label={loading ? "Creando cuenta…" : "Crear cuenta"}
              onPress={submit}
              loading={loading}
              icon={<ArrowRightIcon size={18} color={colors.primaryForeground} />}
            />
            <View style={styles.links}>
              <Text style={[styles.helper, { color: colors.mutedForeground }]}>¿Ya tienes cuenta?</Text>
              <Link href="/(auth)/login" asChild>
                <Pressable>
                  <Text style={[styles.link, { color: colors.primary }]}>Entrar</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: "center", padding: spacing["2xl"], gap: spacing["2xl"] },
  hero: { alignItems: "center", gap: spacing.sm },
  mark: {
    marginBottom: spacing.sm,
  },
  title: { fontFamily: fonts.heading, fontSize: 28, textAlign: "center", letterSpacing: -0.4 },
  subtitle: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, textAlign: "center", maxWidth: 310 },
  panel: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.xl,
    gap: spacing.md,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  error: { fontFamily: fonts.medium, fontSize: 12, lineHeight: 18 },
  links: { flexDirection: "row", justifyContent: "center", gap: spacing.xs, flexWrap: "wrap" },
  helper: { fontFamily: fonts.regular, fontSize: 13 },
  link: { fontFamily: fonts.semibold, fontSize: 13 },
});
