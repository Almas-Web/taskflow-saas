export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  token: string;
  token_type?: string;
}

export interface ApiFetchOptions extends RequestInit {
  requireAuth?: boolean;
  onUnauthorized?: () => void;
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("taskflow_user");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed || typeof parsed.token !== "string" || !parsed.token.trim()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredUser(user: StoredUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("taskflow_user", JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("taskflow_user");
}

export function extractErrorMessage(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;

  const record = data as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail.trim();
  }

  if (Array.isArray(record.detail) && record.detail.length > 0) {
    const first = record.detail[0] as Record<string, unknown>;
    if (typeof first?.msg === "string" && first.msg.trim()) {
      return first.msg.trim();
    }
  }

  if (typeof record.message === "string" && record.message.trim()) {
    return record.message.trim();
  }

  return fallback;
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const {
    requireAuth = true,
    onUnauthorized,
    headers: customHeaders,
    ...rest
  } = options;

  const headers: Record<string, string> = {};

  if (customHeaders) {
    new Headers(customHeaders).forEach((value, key) => {
      headers[key] = value;
    });
  }

  if (rest.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (requireAuth) {
    const user = getStoredUser();
    if (!user?.token) {
      onUnauthorized?.();
      throw new Error("Please log in to continue.");
    }
    headers.Authorization = `Bearer ${user.token}`;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${normalizedPath}`, {
      cache: "no-store",
      ...rest,
      headers,
    });
  } catch {
    throw new Error("Cannot reach server. Please check if FastAPI is running.");
  }

  if (res.status === 401 && requireAuth) {
    clearStoredUser();
    onUnauthorized?.();
    throw new Error("Session expired or invalid. Please log in again.");
  }

  let payload: unknown = null;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      payload = await res.json();
    } catch {
      payload = null;
    }
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(payload, `Request failed (${res.status})`));
  }

  return payload as T;
}