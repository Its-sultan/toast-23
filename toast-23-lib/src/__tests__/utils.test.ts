/**
 * toast-23 — Utility Tests
 */
import { describe, it, expect } from "vitest";
import { generateId, cx } from "../utils";

describe("generateId", () => {
  it("generates a string starting with t23-", () => {
    const id = generateId();
    expect(id).toMatch(/^t23-/);
  });

  it("generates unique IDs", () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()));
    expect(ids.size).toBe(100);
  });
});

describe("cx", () => {
  it("joins class names", () => {
    expect(cx("a", "b", "c")).toBe("a b c");
  });

  it("filters falsy values", () => {
    expect(cx("a", false, null, undefined, 0, "b")).toBe("a b");
  });

  it("returns empty string with no truthy args", () => {
    expect(cx(false, null, undefined)).toBe("");
  });
});
