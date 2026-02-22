/**
 * toast-23 — Utility helpers
 */

let counter = 0;

/**
 * Generates a unique toast id.
 * Works in SSR (no dependency on `crypto`).
 */
export function generateId(): string {
  return `t23-${++counter}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Deterministic class-name builder (replaces clsx dependency).
 */
export function cx(...args: (string | false | null | undefined | 0)[]): string {
  return args.filter(Boolean).join(" ");
}
