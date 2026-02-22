/**
 * toast-23 — Reducer Tests
 */
import { describe, it, expect } from "vitest";
import { toasterReducer } from "../context";
import type { InternalToast } from "../types";

function createToast(overrides: Partial<InternalToast> = {}): InternalToast {
  return {
    id: "test-1",
    message: "Test",
    variant: "default",
    duration: 5000,
    position: "top-right",
    dismissible: true,
    removeDelay: 1000,
    isExiting: false,
    createdAt: Date.now(),
    version: 0,
    ...overrides,
  };
}

describe("toasterReducer", () => {
  it("ADD adds a toast", () => {
    const toast = createToast();
    const state = toasterReducer([], { type: "ADD", toast });
    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("test-1");
  });

  it("UPSERT inserts a new toast", () => {
    const toast = createToast({ id: "upsert-1" });
    const state = toasterReducer([], { type: "UPSERT", toast });
    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("upsert-1");
  });

  it("UPSERT updates an existing toast", () => {
    const initial = createToast({ id: "upsert-1", message: "Old" });
    const updated = createToast({ id: "upsert-1", message: "New" });
    const state = toasterReducer([initial], { type: "UPSERT", toast: updated });
    expect(state).toHaveLength(1);
    expect(state[0].message).toBe("New");
    expect(state[0].version).toBe(1); // bumped
  });

  it("UPDATE modifies a toast", () => {
    const toast = createToast({ id: "t1", message: "Before" });
    const state = toasterReducer([toast], {
      type: "UPDATE",
      id: "t1",
      updates: { message: "After", variant: "success" },
    });
    expect(state[0].message).toBe("After");
    expect(state[0].variant).toBe("success");
    expect(state[0].version).toBe(1);
  });

  it("DISMISS marks a specific toast as exiting", () => {
    const t1 = createToast({ id: "t1" });
    const t2 = createToast({ id: "t2" });
    const state = toasterReducer([t1, t2], { type: "DISMISS", id: "t1" });
    expect(state[0].isExiting).toBe(true);
    expect(state[1].isExiting).toBe(false);
  });

  it("DISMISS without id marks all toasts as exiting", () => {
    const t1 = createToast({ id: "t1" });
    const t2 = createToast({ id: "t2" });
    const state = toasterReducer([t1, t2], { type: "DISMISS" });
    expect(state[0].isExiting).toBe(true);
    expect(state[1].isExiting).toBe(true);
  });

  it("REMOVE removes a specific toast", () => {
    const t1 = createToast({ id: "t1" });
    const t2 = createToast({ id: "t2" });
    const state = toasterReducer([t1, t2], { type: "REMOVE", id: "t1" });
    expect(state).toHaveLength(1);
    expect(state[0].id).toBe("t2");
  });

  it("REMOVE without id removes all toasts", () => {
    const t1 = createToast({ id: "t1" });
    const t2 = createToast({ id: "t2" });
    const state = toasterReducer([t1, t2], { type: "REMOVE" });
    expect(state).toHaveLength(0);
  });
});
