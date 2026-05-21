/**
 * toast-23 — Reducer tests for v2 actions (groups).
 */
import { describe, it, expect } from "vitest";
import { toasterReducer } from "../context";
import type { InternalToast } from "../types";

function toast(id: string, group?: string): InternalToast {
  return {
    id,
    message: id,
    variant: "default",
    duration: 5000,
    position: "top-right",
    dismissible: true,
    removeDelay: 300,
    isExiting: false,
    createdAt: Date.now(),
    version: 0,
    group,
  };
}

describe("toasterReducer v2 actions", () => {
  it("DISMISS_GROUP marks every member of the group as exiting", () => {
    const state = [
      toast("a", "g1"),
      toast("b", "g1"),
      toast("c", "g2"),
      toast("d"),
    ];
    const next = toasterReducer(state, { type: "DISMISS_GROUP", group: "g1" });
    expect(next.find((t) => t.id === "a")?.isExiting).toBe(true);
    expect(next.find((t) => t.id === "b")?.isExiting).toBe(true);
    expect(next.find((t) => t.id === "c")?.isExiting).toBe(false);
    expect(next.find((t) => t.id === "d")?.isExiting).toBe(false);
  });

  it("REMOVE_GROUP filters out every member of the group", () => {
    const state = [toast("a", "g1"), toast("b", "g1"), toast("c", "g2")];
    const next = toasterReducer(state, { type: "REMOVE_GROUP", group: "g1" });
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("c");
  });

  it("DISMISS_GROUP is a no-op when no toasts match the group", () => {
    const state = [toast("a", "g1")];
    const next = toasterReducer(state, {
      type: "DISMISS_GROUP",
      group: "missing",
    });
    expect(next[0].isExiting).toBe(false);
  });

  it("DISMISS_GROUP doesn't re-mark already-exiting toasts (object identity preserved)", () => {
    const a = { ...toast("a", "g1"), isExiting: true };
    const state = [a];
    const next = toasterReducer(state, { type: "DISMISS_GROUP", group: "g1" });
    expect(next[0]).toBe(a); // same reference
  });
});
