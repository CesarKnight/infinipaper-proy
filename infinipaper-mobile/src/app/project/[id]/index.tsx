import { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import {
  ArrowLeftIcon,
  BrainCircuitIcon,
  ClipboardListIcon,
  DownloadIcon,
  FileIcon,
  FileTextIcon,
  FolderIcon,
  HomeIcon,
  ImageIcon,
  MusicIcon,
  PlusIcon,
  ShieldCheckIcon,
  UploadCloudIcon,
  VideoIcon,
} from "lucide-react-native";
import { TopBar } from "../../../components/top-bar";
import { Card, Chip, EmptyState, Loading } from "../../../components/ui";
import { useAuth } from "../../../lib/auth";
import { apiFetch, formatBytes, formatDate } from "../../../lib/api";
import { openDownloadedResource, uploadAsset } from "../../../lib/files";
import type { FolderNode, FolderTree, Paged, Project, Resource } from "../../../types";
import { fonts, radius, spacing, useAppTheme } from "../../../theme";

function flattenFolders(nodes: FolderNode[], depth = 0, acc: (FolderNode & { depth: number })[] = []) {
  for (const node of nodes) {
    acc.push({ ...node, depth });
    flattenFolders(node.children, depth + 1, acc);
  }
  return acc;
}

function resourceIcon(kind: Resource["kind"], color: string) {
  switch (kind) {
    case "IMAGE":
      return <ImageIcon size={19} color={color} />;
    case "AUDIO":
      return <MusicIcon size={19} color={color} />;
    case "VIDEO":
      return <VideoIcon size={19} color={color} />;
    case "MARKDOWN":
      return <FileTextIcon size={19} color={color} />;
    case "QUIZ":
      return <ClipboardListIcon size={19} color={color} />;
    case "MINDMAP":
      return <BrainCircuitIcon size={19} color={color} />;
    default:
      return <FileIcon size={19} color={color} />;
  }
}

export default function ProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const projectQuery = useQuery({
    queryKey: ["project", id, token],
    queryFn: () => apiFetch<Project>(`/projects/${id}`, { token }),
  });
  const treeQuery = useQuery({
    queryKey: ["folders", id, token],
    queryFn: () => apiFetch<FolderTree>(`/projects/${id}/folders`, { token }),
  });

  const tree = treeQuery.data;
  const effectiveFolderId = selectedFolderId ?? tree?.rootId ?? null;
  const folders = useMemo(() => {
    const children = flattenFolders(tree?.tree ?? []);
    return tree?.rootId
      ? [{ id: tree.rootId, name: "Raíz", isRoot: true, depth: 0 } as FolderNode & { depth: number }, ...children]
      : children;
  }, [tree]);

  const filesQuery = useQuery({
    queryKey: ["files", effectiveFolderId, token],
    enabled: Boolean(effectiveFolderId),
    queryFn: () =>
      apiFetch<Paged<Resource>>(`/folders/${effectiveFolderId}/files`, { token }),
  });

  const project = projectQuery.data;
  const canEdit = project?.role === "owner" || project?.role === "editor";
  const files = filesQuery.data?.items ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["files", effectiveFolderId] });
    queryClient.invalidateQueries({ queryKey: ["project", id] });
  };

  async function uploadAssets(assets: { uri: string; name: string; mimeType?: string | null }[]) {
    if (!token || !effectiveFolderId || !assets.length) return;
    setUploading(true);
    try {
      for (const asset of assets) {
        await uploadAsset(effectiveFolderId, asset, token);
      }
      invalidate();
      Alert.alert("Listo", `${assets.length} archivo(s) subido(s).`);
    } catch (error) {
      Alert.alert("No se pudo subir", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function pickFiles() {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
      type: "*/*",
    });
    if (!result.canceled) {
      await uploadAssets(
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
        })),
      );
    }
  }

  async function pickImages(fromCamera: boolean) {
    if (fromCamera) {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permiso necesario", "Necesitamos acceso a la cámara para subir una foto.");
        return;
      }
    }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.9 })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
          allowsMultipleSelection: true,
        });
    if (!result.canceled) {
      await uploadAssets(
        result.assets.map((asset, index) => ({
          uri: asset.uri,
          name: asset.fileName ?? `foto-${Date.now()}-${index}.jpg`,
          mimeType: asset.mimeType,
        })),
      );
    }
  }

  function openUploadMenu() {
    Alert.alert("Subir a esta carpeta", "Elige el origen del archivo.", [
      { text: "Archivo", onPress: () => void pickFiles() },
      { text: "Foto de galería", onPress: () => void pickImages(false) },
      { text: "Cámara", onPress: () => void pickImages(true) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function download(resource: Resource) {
    if (!token) return;
    try {
      await openDownloadedResource(resource, token);
    } catch (error) {
      Alert.alert("No se pudo abrir", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title={project?.name} />
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ArrowLeftIcon size={19} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
            {project?.type === "COURSE" ? "Curso" : "Proyecto"} · {project?.visibility === "PUBLIC" ? "Público" : "Privado"}
          </Text>
          <Text style={[styles.title, { color: colors.foreground }]}>{project?.name ?? "Cargando…"}</Text>
        </View>
        {project?.role ? <Chip label={project.role === "owner" ? "Owner" : project.role === "editor" ? "Editor" : project.role === "student" ? "Estudiante" : "Lector"} /> : null}
      </View>

      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={projectQuery.isRefetching || filesQuery.isRefetching}
            onRefresh={() => {
              projectQuery.refetch();
              filesQuery.refetch();
            }}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View style={{ gap: spacing.lg }}>
            {project?.description ? (
              <Card style={{ gap: spacing.sm }}>
                <Text style={[styles.description, { color: colors.mutedForeground }]}>{project.description}</Text>
                {project.type === "COURSE" ? (
                  <View style={styles.metaLine}>
                    <ShieldCheckIcon size={14} color={colors.primary} />
                    <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                      {[project.institution, project.period, project.subject].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                ) : null}
              </Card>
            ) : null}
            <View style={{ gap: spacing.sm }}>
              <Text style={[styles.section, { color: colors.foreground }]}>Carpetas</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.folderScroll}>
                {folders.map((folder) => {
                  const active = folder.id === effectiveFolderId;
                  return (
                    <Pressable
                      key={folder.id}
                      onPress={() => setSelectedFolderId(folder.id)}
                      style={[
                        styles.folderChip,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      {folder.isRoot ? (
                        <HomeIcon size={15} color={active ? colors.primaryForeground : colors.mutedForeground} />
                      ) : (
                        <FolderIcon size={15} color={active ? colors.primaryForeground : colors.mutedForeground} />
                      )}
                      <Text style={[styles.folderText, { color: active ? colors.primaryForeground : colors.foreground }]} numberOfLines={1}>
                        {folder.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
            <View style={styles.sectionRow}>
              <Text style={[styles.section, { color: colors.foreground }]}>Archivos</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{files.length} elemento(s)</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          filesQuery.isLoading ? (
            <Loading label="Cargando archivos…" />
          ) : (
            <EmptyState
              title="Carpeta vacía"
              message={canEdit ? "Sube material o arrastra archivos desde tu dispositivo." : "Todavía no hay material en esta carpeta."}
            />
          )
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: "/file/[id]", params: { id: item.id } })}
            style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
          >
            <Card style={styles.resourceCard}>
              <View style={[styles.resourceIcon, { backgroundColor: colors.secondary }]}>
                {resourceIcon(item.kind, colors.primary)}
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Text style={[styles.resourceName, { color: colors.foreground }]} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>
                  {item.kind} · {formatBytes(item.size)} · {formatDate(item.createdAt)}
                </Text>
              </View>
              <Pressable
                onPress={() => void download(item)}
                hitSlop={10}
                style={[styles.download, { backgroundColor: colors.muted }]}
              >
                <DownloadIcon size={17} color={colors.primary} />
              </Pressable>
            </Card>
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListFooterComponent={<View style={{ height: 110 }} />}
      />

      {canEdit ? (
        <Pressable
          onPress={openUploadMenu}
          disabled={uploading}
          style={[styles.fab, { backgroundColor: colors.primary, opacity: uploading ? 0.6 : 1 }]}
        >
          {uploading ? <UploadCloudIcon size={23} color={colors.primaryForeground} /> : <PlusIcon size={25} color={colors.primaryForeground} />}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  back: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 0.8, textTransform: "uppercase" },
  title: { fontFamily: fonts.heading, fontSize: 23, letterSpacing: -0.4 },
  content: { padding: spacing.lg },
  description: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20 },
  metaLine: { flexDirection: "row", gap: spacing.xs, alignItems: "center" },
  meta: { fontFamily: fonts.regular, fontSize: 11 },
  section: { fontFamily: fonts.heading, fontSize: 18 },
  sectionRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  folderScroll: { gap: spacing.sm, paddingRight: spacing.lg },
  folderChip: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8, maxWidth: 190 },
  folderText: { fontFamily: fonts.medium, fontSize: 12, maxWidth: 150 },
  resourceCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  resourceIcon: { width: 42, height: 42, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  resourceName: { fontFamily: fonts.semibold, fontSize: 14 },
  download: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  fab: { position: "absolute", right: spacing.xl, bottom: 104, width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", shadowColor: "#1B1633", shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
});
