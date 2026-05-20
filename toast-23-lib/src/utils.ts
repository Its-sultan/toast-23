/**
 * toast-23 — Utility helpers
 */

let counter = 0;

export function generateId(): string {
  return `t23-${++counter}-${Math.random().toString(36).slice(2, 9)}`;
}

export function cx(...args: (string | false | null | undefined | 0)[]): string {
  return args.filter(Boolean).join(" ");
}

/**
 * Returns the swipe-axis sign for a position: -1 means swipe-left dismisses,
 * +1 means swipe-right dismisses. Top/bottom-center positions allow either.
 */
export function getSwipeDirection(position: string): -1 | 0 | 1 {
  if (position.endsWith("right")) return 1;
  if (position.endsWith("left")) return -1;
  return 0; // center positions accept either direction
}
