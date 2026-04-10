import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock fetch globally
const fetchMock = vi.fn();
globalThis.fetch = fetchMock;

// Mock navigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

const { default: LoginPage } = await import("../LoginPage");

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  mockNavigate.mockReset();
  localStorage.clear();
});

describe("LoginPage", () => {
  it("renders login form", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("tu@email.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("••••••••")).toBeInTheDocument();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("submits credentials and navigates on success", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access_token: "tok123", token_type: "bearer" }),
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "test@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "pass123" } });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/");
    });
    expect(localStorage.getItem("token")).toBe("tok123");
  });

  it("shows error on failed login", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ detail: "Credenciales incorrectas" }),
    });

    renderLogin();
    fireEvent.change(screen.getByPlaceholderText("tu@email.com"), { target: { value: "bad@test.com" } });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText("Credenciales incorrectas")).toBeInTheDocument();
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
