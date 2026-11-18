import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { ChevronRightIcon, LogOutIcon, MailCheckIcon, ShieldCheckIcon } from "lucide-react-native";
import { TopBar } from "../../components/top-bar";
import { BrandMark } from "../../components/brand-mark";
import { Card, Chip, PrimaryButton, SectionTitle } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { fonts, radius, spacing, useAppTheme } from "../../theme";

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  TEACHER: "Docente",
  STUDENT: "Estudiante",
};

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { colors } = useAppTheme();

  if (!user) return null;
  const initials = user.displayName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.content}>
        <Card style={{ alignItems: "center", gap: spacing.md, paddingVertical: spacing["3xl"] }}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.initials, { color: colors.primaryForeground }]}>{initials}</Text>
          </View>
          <View style={{ alignItems: "center", gap: 4 }}>
            <Text style={[styles.name, { color: colors.foreground }]}>{user.displayName}</Text>
            <Text style={[styles.username, { color: colors.mutedForeground }]}>@{user.username}</Text>
          </View>
          <View style={styles.chips}>
            <Chip label={ROLE_LABEL[user.role] ?? user.role} tone="accent" />
            <Chip label={user.emailVerifiedAt ? "Email confirmado" : "Email sin confirmar"} tone={user.emailVerifiedAt ? "success" : "default"} />
          </View>
        </Card>

        <SectionTitle title="Tu cuenta" subtitle="Identidad y acceso." />
        <Card style={{ gap: spacing.lg }}>
          <InfoRow icon={<MailCheckIcon size={18} color={colors.primary} />} label="Correo" value={user.email} />
          <InfoRow icon={<ShieldCheckIcon size={18} color={colors.primary} />} label="Rol global" value={ROLE_LABEL[user.role] ?? user.role} />
          <InfoRow icon={<BrandMark size={18} />} label="Miembro desde" value={new Date(user.createdAt).toLocaleDateString("es")} />
        </Card>

        {user.role === "ADMIN" ? (
          <Pressable onPress={() => router.push("/admin/teacher-verifications")}>
            <Card style={styles.action}>
              <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                <ShieldCheckIcon size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: colors.foreground }]}>Verificaciones docentes</Text>
                <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Revisa y aprueba solicitudes.</Text>
              </View>
              <ChevronRightIcon size={19} color={colors.mutedForeground} />
            </Card>
          </Pressable>
        ) : null}

        <PrimaryButton
          label="Cerrar sesión"
          variant="ghost"
          icon={<LogOutIcon size={18} color={colors.foreground} />}
          onPress={() =>
            Alert.alert("Cerrar sesión", "¿Quieres salir de Infinipaper?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Salir", style: "destructive", onPress: () => void logout() },
            ])
          }
        />
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>Infinipaper Mobile · 2026</Text>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.muted }]}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.heading, fontSize: 30 },
  name: { fontFamily: fonts.heading, fontSize: 25, letterSpacing: -0.4 },
  username: { fontFamily: fonts.regular, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  infoIcon: { width: 38, height: 38, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  infoLabel: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  infoValue: { fontFamily: fonts.regular, fontSize: 14 },
  action: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actionIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionTitle: { fontFamily: fonts.semibold, fontSize: 15 },
  actionSubtitle: { fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },
  footer: { fontFamily: fonts.regular, fontSize: 10, textAlign: "center", letterSpacing: 1 },
});
