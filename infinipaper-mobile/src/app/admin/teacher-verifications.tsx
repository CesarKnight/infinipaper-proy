import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CheckIcon, XIcon } from "lucide-react-native";
import { TopBar } from "../../components/top-bar";
import { Card, Chip, EmptyState, Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import { fonts, radius, spacing, useAppTheme } from "../../theme";

interface Verification {
  id: string;
  status: string;
  institution: string;
  area: string | null;
  position: string | null;
  evidenceUrl: string | null;
  createdAt: string;
  user: {
    displayName: string;
    username: string;
    email: string;
    emailVerifiedAt: string | null;
  };
}

export default function TeacherVerificationsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const query = useQuery({
    queryKey: ["admin-verifications", token],
    enabled: user?.role === "ADMIN",
    queryFn: () =>
      apiFetch<Verification[]>("/admin/teacher-verifications?status=PENDING", { token }),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin-verifications"] });

  const approve = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/teacher-verifications/${id}/approve`, {
        method: "POST",
        token,
        body: { reason: "Aprobado desde la app móvil" },
      }),
    onSuccess: () => {
      invalidate();
      Alert.alert("Docente aprobado", "El perfil ahora puede crear cursos.");
    },
    onError: (error) =>
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo aprobar."),
  });

  const reject = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/admin/teacher-verifications/${id}/reject`, {
        method: "POST",
        token,
        body: { reason: "Revisión pendiente de nuevos antecedentes" },
      }),
    onSuccess: () => {
      invalidate();
      Alert.alert("Solicitud rechazada", "El docente puede corregir y reenviar.");
    },
    onError: (error) =>
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo rechazar."),
  });

  if (user?.role !== "ADMIN") {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar title="Administración" />
        <EmptyState title="Acceso restringido" message="Solo un administrador puede revisar docentes." />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Verificaciones docentes" />
      <View style={styles.top}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ArrowLeftIcon size={19} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Solicitudes pendientes</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>Revisa identidad institucional y evidencia.</Text>
        </View>
      </View>
      <FlatList
        data={query.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListEmptyComponent={
          query.isLoading ? <Loading label="Cargando solicitudes…" /> : <EmptyState title="Todo al día" message="No hay solicitudes docentes pendientes." />
        }
        renderItem={({ item }) => (
          <Card style={{ gap: spacing.md }}>
            <View style={styles.row}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {item.user.displayName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.name, { color: colors.foreground }]}>{item.user.displayName}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>@{item.user.username} · {item.institution}</Text>
              </View>
              <Chip label={item.status} />
            </View>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>
              {[item.area, item.position].filter(Boolean).join(" · ") || "Sin área especificada"}
            </Text>
            <View style={styles.actions}>
              <Pressable
                onPress={() => approve.mutate(item.id)}
                style={[styles.action, { backgroundColor: colors.success }]}
              >
                <CheckIcon size={17} color="#fff" />
                <Text style={styles.actionText}>Aprobar</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  Alert.alert("Rechazar solicitud", "¿Confirmas el rechazo?", [
                    { text: "Cancelar", style: "cancel" },
                    { text: "Rechazar", style: "destructive", onPress: () => reject.mutate(item.id) },
                  ])
                }
                style={[styles.action, { backgroundColor: colors.muted }]}
              >
                <XIcon size={17} color={colors.danger} />
                <Text style={[styles.actionText, { color: colors.danger }]}>Rechazar</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListFooterComponent={<View style={{ height: 60 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  back: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.heading, fontSize: 21 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  content: { padding: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: fonts.semibold, fontSize: 12 },
  name: { fontFamily: fonts.semibold, fontSize: 15 },
  actions: { flexDirection: "row", gap: spacing.sm },
  action: { flex: 1, minHeight: 40, borderRadius: radius.md, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  actionText: { fontFamily: fonts.semibold, fontSize: 12, color: "#fff" },
});
