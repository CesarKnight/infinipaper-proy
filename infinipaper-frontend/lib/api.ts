export const API_BASE = "/api/v1";

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

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** Si el body es FormData, no se serializa a JSON. */
  raw?: boolean;
  signal?: AbortSignal;
}

/**
 * Cliente HTTP. Usa rutas relativas (/api/...) para que el navegador
 * hable con su mismo origen; Next reenvía al backend (rewrites) y la
 * cookie httpOnly viaja automáticamente.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, raw = false, signal } = options;

  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body !== undefined) {
    if (raw || body instanceof FormData) {
      payload = body as BodyInit;
    } else {
      headers["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: payload,
    credentials: "include",
    signal,
  });

  if (response.status === 204) {
    return undefined as T;
  }

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

/** URL absoluta del contenido de un recurso (mismo origen). */
export function fileContentUrl(fileId: string): string {
  return `${API_BASE}/files/${fileId}/content`;
}

export function userAvatarUrl(username: string): string {
  return `${API_BASE}/users/${username}/avatar`;
}
