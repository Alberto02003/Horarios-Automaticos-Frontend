export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

const SAFE_MESSAGES: Record<string, string> = {
  "Credenciales incorrectas": "Credenciales incorrectas",
  "Usuario desactivado": "Usuario desactivado",
  "Miembro no encontrado": "Miembro no encontrado",
  "Tipo de turno no encontrado": "Tipo de turno no encontrado",
  "Periodo no encontrado": "Periodo no encontrado",
  "Asignacion no encontrada": "Asignacion no encontrada",
  "El periodo ya esta activo": "El periodo ya esta activo",
  "No se puede generar en un periodo activo": "No se puede generar en un periodo activo",
  "Solo se permiten imagenes": "Solo se permiten imagenes",
  "Maximo 2MB": "Maximo 2MB",
  "CSRF token invalido": "Sesion expirada, recarga la pagina",
};

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "Solicitud incorrecta",
  401: "Sesion expirada",
  403: "Sin permisos",
  404: "No encontrado",
  422: "Datos no validos",
  429: "Demasiadas peticiones, espera un momento",
  500: "Error del servidor, intenta de nuevo",
};

function sanitizeError(status: number, detail?: string): string {
  if (detail && detail in SAFE_MESSAGES) return SAFE_MESSAGES[detail];
  if (detail && detail.startsWith("Ya existe un periodo activo")) return detail;
  return FALLBACK_MESSAGES[status] || "Error inesperado";
}

function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

async function tryRefreshToken(): Promise<boolean> {
  try {
    const csrf = getCsrfToken();
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: csrf ? { "X-CSRF-Token": csrf } : {},
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, headers, ...rest } = options;

  const url = new URL(`${API_BASE}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  }

  const token = localStorage.getItem("token");
  const response = await fetch(url.toString(), {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...rest,
  });

  // Auto-refresh on 401
  if (response.status === 401 && !endpoint.includes("/auth/refresh")) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await tryRefreshToken();
      isRefreshing = false;

      if (refreshed) {
        // Retry original request with new token
        refreshQueue.forEach((cb) => cb());
        refreshQueue = [];
        return request<T>(endpoint, options);
      }
    } else {
      // Wait for refresh to complete then retry
      return new Promise<T>((resolve) => {
        refreshQueue.push(() => resolve(request<T>(endpoint, options)));
      });
    }

    // Refresh failed — logout
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const safeMessage = sanitizeError(response.status, body.detail);
    throw new Error(safeMessage);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) =>
    request<T>(endpoint, { method: "GET", params }),

  post: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "POST", body: JSON.stringify(data) }),

  put: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "PUT", body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) }),

  delete: <T>(endpoint: string, data?: unknown) =>
    request<T>(endpoint, { method: "DELETE", ...(data ? { body: JSON.stringify(data) } : {}) }),
};
