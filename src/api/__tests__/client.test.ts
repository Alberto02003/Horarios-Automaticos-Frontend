import { describe, it, expect, vi, beforeEach } from "vitest";

// Must import after mocking
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

// Import after fetch is mocked
const { api } = await import("../client");

beforeEach(() => {
  fetchMock.mockReset();
  localStorage.clear();
});

function jsonResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe("api.get", () => {
  it("makes GET request with auth header", async () => {
    localStorage.setItem("token", "test-token");
    fetchMock.mockReturnValue(jsonResponse({ id: 1 }));

    const result = await api.get("/api/test");

    expect(result).toEqual({ id: 1 });
    const call = fetchMock.mock.calls[0];
    expect(call[0]).toContain("/api/test");
    expect(call[1].headers.Authorization).toBe("Bearer test-token");
  });

  it("makes GET request without auth when no token", async () => {
    fetchMock.mockReturnValue(jsonResponse({ ok: true }));

    await api.get("/api/public");

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBeUndefined();
  });
});

describe("api.post", () => {
  it("sends JSON body", async () => {
    fetchMock.mockReturnValue(jsonResponse({ created: true }, 201));

    await api.post("/api/items", { name: "test" });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("POST");
    expect(call[1].body).toBe(JSON.stringify({ name: "test" }));
  });
});

describe("api.delete", () => {
  it("sends body when provided", async () => {
    fetchMock.mockReturnValue(jsonResponse({ deleted: 2 }));

    await api.delete("/api/items/bulk", { ids: [1, 2] });

    const call = fetchMock.mock.calls[0];
    expect(call[1].method).toBe("DELETE");
    expect(call[1].body).toBe(JSON.stringify({ ids: [1, 2] }));
  });

  it("sends no body when not provided", async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(undefined) }));

    await api.delete("/api/items/1");

    const call = fetchMock.mock.calls[0];
    expect(call[1].body).toBeUndefined();
  });
});

describe("error sanitization", () => {
  it("returns safe message for known errors", async () => {
    fetchMock.mockReturnValue(jsonResponse({ detail: "El periodo ya esta activo" }, 400));

    await expect(api.post("/api/test", {})).rejects.toThrow("El periodo ya esta activo");
  });

  it("returns generic message for unknown errors", async () => {
    fetchMock.mockReturnValue(jsonResponse({ detail: "SQL error: table users column..." }, 500));

    await expect(api.get("/api/secret")).rejects.toThrow("Error del servidor, intenta de nuevo");
  });

  it("returns fallback for status without detail", async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({}) }));

    await expect(api.get("/api/missing")).rejects.toThrow("No encontrado");
  });

  it("returns 204 as undefined", async () => {
    fetchMock.mockReturnValue(Promise.resolve({ ok: true, status: 204, json: () => Promise.resolve(undefined) }));

    const result = await api.delete("/api/items/1");
    expect(result).toBeUndefined();
  });
});
