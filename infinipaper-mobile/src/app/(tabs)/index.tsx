import { useMemo } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowUpRightIcon, BookOpenIcon, GraduationCapIcon, UsersIcon } from "lucide-react-native";
import { TopBar } from "../../components/top-bar";
import { Card, Chip, EmptyState, Loading, SectionTitle } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { apiFetch, formatDate } from "../../lib/api";
import type { Paged, Project } from "../../types";
import { fonts, primitives, radius, spacing, useAppTheme } from "../../theme";

const ROLE_LABEL: Record<string, string> = {
  owner: "Propietario",
  editor: "Editor",
  viewer: "Lector",
  student: "Estudiante",
  public: "Público",
};

export default function ProjectsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useAppTheme();
  const projects = useQuery({
    queryKey: ["projects", token],
    enabled: Boolean(token),
    queryFn: () => apiFetch<Paged<Project>>("/projects?scope=all&limit=50", { token }),
  });

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const items = projects.data?.items ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={projects.isRefetching}
            onRefresh={() => { void projects.refetch(); }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing["2xl"] }}>
            <LinearGradient
              colors={isDark ? ["#291054", "#3B2A6E", "#1E0B46"] : ["#4B2EA3", "#6D4AC0", "#A1349F"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.heroGlow} />
              <Chip label={user?.role === "TEACHER" ? "Docente" : user?.role === "ADMIN" ? "Administrador" : "Estudiante"} tone="accent" />
              <Text style={styles.heroEyebrow}>{greeting}, {user?.displayName?.split(" ")[0] ?? "estudiante"}</Text>
              <Text style={styles.heroTitle}>Tu estudio, en orden.</Text>
              <Text style={styles.heroBody}>
                Proyectos, cursos y material académico listos para abrir desde cualquier lugar.
              </Text>
              <View style={styles.heroStats}>
                <Stat icon={<BookOpenIcon size={15} color={primitives.white} />} value={items.length} label="proyectos" />
                <Stat icon={<GraduationCapIcon size={15} color={primitives.white} />} value={items.filter((p) => p.type === "COURSE").length} label="cursos" />
                <Stat icon={<UsersIcon size={15} color={primitives.white} />} value={items.reduce((sum, p) => sum + (p._count?.members ?? 0), 0)} label="personas" />
              </View>
            </LinearGradient>
            <SectionTitle title="Tus espacios" subtitle="Proyectos propios, cursos y colaboraciones." />
          </View>
        }
        ListEmptyComponent={
          projects.isLoading ? (
            <Loading label="Cargando tus proyectos…" />
          ) : (
            <EmptyState
              title="Aún no hay proyectos"
              message="Cuando alguien te invite o crees tu primer proyecto, aparecerá aquí."
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/project/[id]", params: { id: item.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
          >
            <Card style={{ gap: spacing.md }}>
              <View style={styles.cardTop}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                    {item.type === "COURSE" ? item.subject ?? "Curso" : "Proyecto personal"} · {item.visibility === "PUBLIC" ? "Público" : "Privado"}
                  </Text>
                </View>
                <View style={[styles.arrow, { backgroundColor: colors.secondary }]}>
                  <ArrowUpRightIcon size={18} color={colors.primary} />
                </View>
              </View>
              {item.description ? (
                <Text numberOfLines={2} style={[styles.description, { color: colors.mutedForeground }]}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.badges}>
                {item.role ? <Chip label={ROLE_LABEL[item.role] ?? item.role} /> : null}
                {item.type === "COURSE" ? <Chip label="Curso" /> : null}
                {item.status === "ARCHIVED" ? <Chip label="Archivado" tone="danger" /> : null}
                <Text style={[styles.date, { color: colors.mutedForeground }]}>{formatDate(item.createdAt)}</Text>
              </View>
            </Card>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />
    </View>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      {icon}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  hero: {
    borderRadius: radius.xl,
    padding: spacing["2xl"],
    gap: spacing.sm,
    overflow: "hidden",
    shadowColor: primitives.indigo,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroGlow: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.12)",
    right: -60,
    top: -80,
  },
  heroEyebrow: { fontFamily: fonts.medium, color: "rgba(255,255,255,0.78)", fontSize: 12, marginTop: spacing.sm },
  heroTitle: { fontFamily: fonts.heading, color: primitives.white, fontSize: 30, letterSpacing: -0.6 },
  heroBody: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 20, maxWidth: 300 },
  heroStats: { flexDirection: "row", gap: spacing.xl, marginTop: spacing.md },
  stat: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  statValue: { fontFamily: fonts.heading, color: primitives.white, fontSize: 20 },
  statLabel: { fontFamily: fonts.regular, color: "rgba(255,255,255,0.7)", fontSize: 10 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  cardTitle: { fontFamily: fonts.heading, fontSize: 19, letterSpacing: -0.3 },
  cardMeta: { fontFamily: fonts.regular, fontSize: 12 },
  arrow: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  badges: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flexWrap: "wrap" },
  date: { fontFamily: fonts.regular, fontSize: 11, marginLeft: "auto" },
});
