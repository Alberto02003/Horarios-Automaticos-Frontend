const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8080";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

let isRefreshing = false;
let refreshQueue: (() => void)[] = [];

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
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
    localStorage.removeItem("refresh_token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `Error ${response.status}`);
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
