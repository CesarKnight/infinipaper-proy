import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { CalendarDaysIcon, CheckCircle2Icon, ClipboardCheckIcon } from "lucide-react-native";
import { TopBar } from "../../components/top-bar";
import { Card, Chip, EmptyState, Loading, SectionTitle } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { apiFetch, formatDate } from "../../lib/api";
import type { Assignment } from "../../types";
import { fonts, spacing, useAppTheme } from "../../theme";

export default function TasksScreen() {
  const { user, token } = useAuth();
  const { colors } = useAppTheme();
  const assignments = useQuery({
    queryKey: ["assignments", token],
    enabled: Boolean(token),
    queryFn: () => apiFetch<Assignment[]>("/assignments/mine", { token }),
  });

  const isStudent = user?.role === "STUDENT";

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <FlatList
        data={assignments.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={assignments.isRefetching}
            onRefresh={() => { void assignments.refetch(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.md }}>
            <SectionTitle
              title="Tareas y evaluación"
              subtitle={isStudent ? "Tus cuestionarios asignados y su estado." : "La evaluación se gestiona desde cada proyecto."}
            />
          </View>
        }
        ListEmptyComponent={
          assignments.isLoading ? (
            <Loading label="Buscando tareas…" />
          ) : (
            <EmptyState
              title={isStudent ? "Todo al día" : "Sin tareas personales"}
              message={
                isStudent
                  ? "No tienes cuestionarios asignados en este momento."
                  : "Entra a un proyecto para revisar o gestionar sus tareas."
              }
            />
          )
        }
        renderItem={({ item }) => {
          const latest = item.attempts?.[0];
          const completed = latest && ["SUBMITTED", "GRADED"].includes(latest.status);
          return (
            <Card style={{ gap: spacing.md }}>
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: colors.secondary }]}>
                  <ClipboardCheckIcon size={19} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={[styles.title, { color: colors.foreground }]}>{item.quiz.title}</Text>
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {item.quiz.resource?.name ?? "Cuestionario"} · {item.status}
                  </Text>
                </View>
                <Chip label={completed ? "Enviada" : "Pendiente"} tone={completed ? "success" : "default"} />
              </View>
              <View style={styles.footer}>
                <View style={styles.metaRow}>
                  <CalendarDaysIcon size={14} color={colors.mutedForeground} />
                  <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                    {item.dueAt ? `Entrega ${formatDate(item.dueAt)}` : "Sin fecha límite"}
                  </Text>
                </View>
                {completed ? (
                  <View style={styles.metaRow}>
                    <CheckCircle2Icon size={14} color={colors.success} />
                    <Text style={[styles.meta, { color: colors.success }]}>
                      {latest.score}/{latest.maxScore}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.heading, fontSize: 18, letterSpacing: -0.2 },
  meta: { fontFamily: fonts.regular, fontSize: 12 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
});
