import { describe, it, expect, vi, beforeEach } from "vitest";

globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true })) as unknown as typeof fetch;

const { useAuthStore } = await import("../authStore");

beforeEach(() => {
  localStorage.clear();
  useAuthStore.setState({ token: null, isAuthenticated: false });
});

describe("authStore", () => {
  it("starts unauthenticated when no token in localStorage", () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.token).toBeNull();
  });

  it("login sets token and isAuthenticated", () => {
    useAuthStore.getState().login("access-123");

    const state = useAuthStore.getState();
    expect(state.token).toBe("access-123");
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem("token")).toBe("access-123");
  });

  it("logout clears token and calls server", () => {
    useAuthStore.getState().login("access-123");
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logout does not store refresh_token in localStorage", () => {
    useAuthStore.getState().login("access-123");
    useAuthStore.getState().logout();

    expect(localStorage.getItem("refresh_token")).toBeNull();
  });
});
