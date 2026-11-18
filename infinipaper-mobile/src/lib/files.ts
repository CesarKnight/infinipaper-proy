import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import type { Resource } from "../types";
import { API_BASE, apiFetch, authHeaders } from "./api";

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._ -]/g, "_");
}

export async function downloadResource(resource: Resource, token: string) {
  const destination = new File(Paths.cache, `${Date.now()}-${safeName(resource.name)}`);
  const file = await File.downloadFileAsync(
    `${API_BASE}/files/${resource.id}/content?download=1`,
    destination,
    {
      headers: authHeaders(token),
      idempotent: true,
    },
  );
  return file;
}

export async function openDownloadedResource(resource: Resource, token: string) {
  const file = await downloadResource(resource, token);
  if (await File.canPreview([file])) {
    await File.preview([file], { title: resource.name });
    return;
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: resource.mimeType,
      dialogTitle: resource.name,
    });
    return;
  }
  return file;
}

export async function shareResource(resource: Resource, token: string) {
  const file = await downloadResource(resource, token);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, {
      mimeType: resource.mimeType,
      dialogTitle: resource.name,
    });
  }
  return file;
}

export async function ensureCacheDirectory() {
  const dir = new Directory(Paths.cache, "infinipaper");
  if (!dir.exists) dir.create({ intermediates: true });
  return dir;
}

export async function uploadAsset(
  folderId: string,
  asset: { uri: string; name: string; mimeType?: string | null },
  token: string,
) {
  const form = new FormData();
  // Expo SDK 58 usa su propio fetch: no acepta el objeto { uri, name, type }
  // de React Native y el Blob nativo no acepta ArrayBuffer. El File de
  // expo-file-system implementa bytes() y sí es compatible con ExpoFormData.
  const file = new File(asset.uri);
  Object.defineProperties(file, {
    name: { value: asset.name, configurable: true },
    type: {
      value: asset.mimeType ?? "application/octet-stream",
      configurable: true,
    },
  });
  form.append("file", file as unknown as Blob);
  return apiFetch(`/folders/${folderId}/files`, {
    method: "POST",
    token,
    formData: form,
  });
}
