/**
 * toast-23 — External store for headless consumers (and DevTools).
 *
 * Each provider owns its own store instance (created via `createHeadlessStore`
 * and handed out through context), so multiple `<Toast23Provider>`s — or
 * multiple `createToast23()` standalone instances — stay fully isolated. The
 * provider pushes its current toast array here on every render; subscribers
 * (`useToast23Headless`, `Toast23DevTools`) read it via `useSyncExternalStore`.
 *
 * Keeping this separate from the React context means the regular `useToast()`
 * hook's returned API stays referentially stable across toast changes — only
 * components that opt-in via the headless hook re-render on every dispatch.
 */

import type { HeadlessStore, InternalToast } from "./types";

export function createHeadlessStore(): HeadlessStore {
  let snapshot: ReadonlyArray<InternalToast> = [];
  const listeners = new Set<() => void>();

  return {
    publish(next) {
      if (snapshot === next) return;
      snapshot = next;
      listeners.forEach((l) => l());
    },
    getSnapshot() {
      return snapshot;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
