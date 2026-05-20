/**
 * toast-23 — Headless hook.
 *
 * Exposes the raw toast queue + dismiss helpers so consumers can render
 * their own UI. Useful for React Native ports, custom designs, or when the
 * bundled CSS doesn't fit.
 *
 * Subscribes via `useSyncExternalStore` so only headless components re-render
 * on queue changes — components using the regular `useToast()` hook are
 * unaffected.
 */

"use client";

import { useContext, useSyncExternalStore } from "react";
import { ToasterContext } from "./context";
import type { InternalToast, ToastHistoryEntry } from "./types";

export interface HeadlessApi {
  toasts: ReadonlyArray<InternalToast>;
  dismiss: (id?: string) => void;
  remove: (id?: string) => void;
  dismissGroup: (group: string) => void;
  removeGroup: (group: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  history: () => ReadonlyArray<ToastHistoryEntry>;
  isPausedGlobally: boolean;
}

export function useToast23Headless(): HeadlessApi {
  const ctx = useContext(ToasterContext);
  if (!ctx) {
    throw new Error(
      "[toast-23] useToast23Headless() must be used inside a <Toast23Provider>.",
    );
  }

  const { headlessStore } = ctx;
  const toasts = useSyncExternalStore(
    headlessStore.subscribe,
    headlessStore.getSnapshot,
    headlessStore.getSnapshot,
  );

  return {
    toasts,
    dismiss: ctx.dismissToast,
    remove: ctx.removeToast,
    dismissGroup: ctx.dismissGroup,
    removeGroup: ctx.removeGroup,
    pauseAll: ctx.pauseAll,
    resumeAll: ctx.resumeAll,
    history: ctx.history,
    isPausedGlobally: ctx.isPausedGlobally,
  };
}
