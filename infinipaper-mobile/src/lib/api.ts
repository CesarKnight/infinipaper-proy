import { Platform } from "react-native";

const DEFAULT_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3001/api/v1"
    : "http://localhost:3001/api/v1";

export const API_BASE = (
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_BASE
).replace(/\/$/, "");

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function authHeaders(token: string | null | undefined): Record<string, string> {
  return token ? { "X-Mobile-Session": token } : {};
}

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string | null;
    formData?: FormData;
    signal?: AbortSignal;
  } = {},
): Promise<T> {
  const { method = "GET", body, token, formData, signal } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...authHeaders(token),
  };
  let payload: BodyInit | undefined;
  if (formData) {
    payload = formData;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
    signal,
  });
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const parsed = (data ?? {}) as {
      code?: string;
      message?: string;
      details?: unknown;
    };
    throw new ApiError(
      response.status,
      parsed.code ?? `HTTP_${response.status}`,
      parsed.message ?? "Ocurrió un error",
      parsed.details,
    );
  }
  return data as T;
}

export function fileUrl(fileId: string, download = false) {
  return `${API_BASE}/files/${fileId}/content${download ? "?download=1" : ""}`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
