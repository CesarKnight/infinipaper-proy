import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { VideoView, useVideoPlayer } from "expo-video";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { WebView } from "react-native-webview";
import Markdown from "react-native-markdown-display";
import {
  ArrowLeftIcon,
  DownloadIcon,
  FileTextIcon,
  PauseIcon,
  PlayIcon,
  Share2Icon,
} from "lucide-react-native";
import { TopBar } from "../../components/top-bar";
import { Card, Chip, Loading } from "../../components/ui";
import { useAuth } from "../../lib/auth";
import { apiFetch, authHeaders, fileUrl, formatBytes } from "../../lib/api";
import { openDownloadedResource, shareResource } from "../../lib/files";
import type { Resource } from "../../types";
import { fonts, radius, spacing, useAppTheme } from "../../theme";

export default function FileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const resourceQuery = useQuery({
    queryKey: ["file", id, token],
    queryFn: () => apiFetch<Resource>(`/files/${id}`, { token }),
  });
  const resource = resourceQuery.data;

  async function download() {
    if (!resource || !token) return;
    try {
      await openDownloadedResource(resource, token);
    } catch (error) {
      Alert.alert("No se pudo abrir", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  }

  async function share() {
    if (!resource || !token) return;
    try {
      await shareResource(resource, token);
    } catch (error) {
      Alert.alert("No se pudo compartir", error instanceof Error ? error.message : "Inténtalo de nuevo.");
    }
  }

  if (resourceQuery.isLoading || !resource) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <TopBar />
        <Loading label="Abriendo archivo…" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Archivo" />
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ArrowLeftIcon size={19} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{resource.name}</Text>
          <Text style={[styles.meta, { color: colors.mutedForeground }]}>
            {resource.kind} · {formatBytes(resource.size)}
          </Text>
        </View>
        <Pressable onPress={() => void share()} style={[styles.iconButton, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Share2Icon size={18} color={colors.foreground} />
        </Pressable>
        <Pressable onPress={() => void download()} style={[styles.iconButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <DownloadIcon size={18} color={colors.primaryForeground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {resource.kind === "IMAGE" ? (
          <Card style={{ padding: 0, overflow: "hidden", backgroundColor: colors.muted }}>
            <Image
              source={{ uri: fileUrl(resource.id), headers: authHeaders(token) }}
              style={{ width: "100%", aspectRatio: 4 / 3 }}
              contentFit="contain"
              transition={180}
              onError={() => setFailed(true)}
            />
            {failed ? <Text style={[styles.error, { color: colors.danger }]}>No se pudo cargar la imagen.</Text> : null}
          </Card>
        ) : null}

        {resource.kind === "VIDEO" ? (
          <VideoPlayer fileId={resource.id} token={token} />
        ) : null}

        {resource.kind === "AUDIO" ? (
          <AudioPlayer fileId={resource.id} token={token} />
        ) : null}

        {resource.kind === "MARKDOWN" ? (
          <MarkdownViewer fileId={resource.id} token={token} />
        ) : null}

        {resource.mimeType === "application/pdf" ? (
          <Card style={{ padding: 0, overflow: "hidden", height: 520 }}>
            <WebView
              source={{ uri: fileUrl(resource.id), headers: authHeaders(token) }}
              style={{ backgroundColor: "#fff" }}
              startInLoadingState
              renderLoading={() => <Loading label="Cargando PDF…" />}
              onError={() => setFailed(true)}
            />
          </Card>
        ) : null}

        {resource.kind === "DOCUMENT" && resource.mimeType !== "application/pdf" ? (
          <Card style={{ gap: spacing.md, alignItems: "center", paddingVertical: spacing["3xl"] }}>
            <View style={[styles.documentIcon, { backgroundColor: colors.secondary }]}>
              <FileTextIcon size={30} color={colors.primary} />
            </View>
            <Text style={[styles.documentTitle, { color: colors.foreground }]}>Vista previa móvil</Text>
            <Text style={[styles.documentBody, { color: colors.mutedForeground }]}>
              Los documentos Word, Excel y PowerPoint se abren con la app compatible de tu dispositivo.
            </Text>
            <Chip label={resource.validationStatus === "VERIFIED" ? "Verificado" : "No verificado"} />
          </Card>
        ) : null}

        {!["IMAGE", "VIDEO", "AUDIO", "MARKDOWN", "DOCUMENT"].includes(resource.kind) ? (
          <Card style={{ gap: spacing.md, alignItems: "center" }}>
            <Text style={[styles.documentTitle, { color: colors.foreground }]}>Vista previa no disponible</Text>
            <Text style={[styles.documentBody, { color: colors.mutedForeground }]}>
              Este formato se puede descargar y abrir con otra aplicación.
            </Text>
          </Card>
        ) : null}

        {failed ? (
          <Text style={[styles.error, { color: colors.danger }]}>
            El visor encontró un problema. Usa Descargar para abrirlo localmente.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

function VideoPlayer({ fileId, token }: { fileId: string; token: string | null }) {
  const player = useVideoPlayer(
    { uri: fileUrl(fileId), headers: authHeaders(token) },
    (instance) => {
      instance.loop = false;
    },
  );
  return (
    <Card style={{ padding: 0, overflow: "hidden", backgroundColor: "#000" }}>
      <VideoView player={player} style={{ width: "100%", aspectRatio: 16 / 9 }} nativeControls contentFit="contain" />
    </Card>
  );
}

function AudioPlayer({ fileId, token }: { fileId: string; token: string | null }) {
  const { colors } = useAppTheme();
  const player = useAudioPlayer({ uri: fileUrl(fileId), headers: authHeaders(token) });
  const status = useAudioPlayerStatus(player);
  const duration = status.duration || 1;
  return (
    <Card style={{ gap: spacing.lg }}>
      <View style={{ alignItems: "center", gap: spacing.sm }}>
        <View style={[styles.audioDisc, { backgroundColor: colors.secondary }]}>
          <FileTextIcon size={30} color={colors.primary} />
        </View>
        <Text style={[styles.documentTitle, { color: colors.foreground }]}>Audio</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>
          {Math.floor(status.currentTime)}s / {Math.floor(duration)}s
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: colors.muted }]}>
        <View style={[styles.trackFill, { backgroundColor: colors.primary, width: `${Math.min(100, (status.currentTime / duration) * 100)}%` }]} />
      </View>
      <View style={{ alignItems: "center" }}>
        <Pressable
          onPress={() => (status.playing ? player.pause() : player.play())}
          style={[styles.playButton, { backgroundColor: colors.primary }]}
        >
          {status.playing ? <PauseIcon size={25} color={colors.primaryForeground} /> : <PlayIcon size={25} color={colors.primaryForeground} />}
        </Pressable>
      </View>
    </Card>
  );
}

function MarkdownViewer({ fileId, token }: { fileId: string; token: string | null }) {
  const { colors } = useAppTheme();
  const text = useQuery({
    queryKey: ["file-text", fileId, token],
    queryFn: () => apiFetch<{ content: string }>(`/files/${fileId}/text`, { token }),
  });
  if (text.isLoading) return <Loading label="Cargando apunte…" />;
  return (
    <Card>
      <Markdown
        style={{
          body: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 15, lineHeight: 24 },
          heading1: { color: colors.foreground, fontFamily: fonts.heading, fontSize: 27 },
          heading2: { color: colors.foreground, fontFamily: fonts.heading, fontSize: 22 },
          heading3: { color: colors.foreground, fontFamily: fonts.heading, fontSize: 18 },
          link: { color: colors.primary },
          code_inline: { backgroundColor: colors.muted, color: colors.foreground },
          fence: { backgroundColor: colors.muted, color: colors.foreground },
          blockquote: { backgroundColor: colors.muted, borderLeftColor: colors.primary },
        }}
      >
        {text.data?.content ?? ""}
      </Markdown>
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  iconButton: { width: 40, height: 40, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: fonts.heading, fontSize: 20, letterSpacing: -0.3 },
  meta: { fontFamily: fonts.regular, fontSize: 11 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: 120 },
  error: { fontFamily: fonts.regular, fontSize: 12, textAlign: "center" },
  documentIcon: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  documentTitle: { fontFamily: fonts.heading, fontSize: 21, textAlign: "center" },
  documentBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, textAlign: "center", maxWidth: 300 },
  audioDisc: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center" },
  track: { height: 6, borderRadius: 3, overflow: "hidden" },
  trackFill: { height: 6, borderRadius: 3 },
  playButton: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" },
});
