import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCrudHandler } from "../useCrudHandler";

interface Item { id: number; name: string }

describe("useCrudHandler", () => {
  it("starts with form closed and no editing/delete", () => {
    const { result } = renderHook(() => useCrudHandler<Item>());
    expect(result.current.showForm).toBe(false);
    expect(result.current.editing).toBeNull();
    expect(result.current.confirmDelete).toBeNull();
  });

  it("openCreate shows form without editing item", () => {
    const { result } = renderHook(() => useCrudHandler<Item>());
    act(() => result.current.openCreate());
    expect(result.current.showForm).toBe(true);
    expect(result.current.editing).toBeNull();
  });

  it("openEdit shows form with item", () => {
    const { result } = renderHook(() => useCrudHandler<Item>());
    act(() => result.current.openEdit({ id: 1, name: "Test" }));
    expect(result.current.showForm).toBe(true);
    expect(result.current.editing).toEqual({ id: 1, name: "Test" });
  });

  it("closeForm resets form and editing", () => {
    const { result } = renderHook(() => useCrudHandler<Item>());
    act(() => result.current.openEdit({ id: 1, name: "Test" }));
    act(() => result.current.closeForm());
    expect(result.current.showForm).toBe(false);
    expect(result.current.editing).toBeNull();
  });

  it("openDelete/closeDelete manages confirm state", () => {
    const { result } = renderHook(() => useCrudHandler<Item>());
    act(() => result.current.openDelete({ id: 2, name: "Del" }));
    expect(result.current.confirmDelete).toEqual({ id: 2, name: "Del" });
    act(() => result.current.closeDelete());
    expect(result.current.confirmDelete).toBeNull();
  });
});
