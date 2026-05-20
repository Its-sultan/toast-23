/**
 * toast-23 — Browser Notification API fallback.
 *
 * When document is hidden, optionally surface a real OS notification so the
 * user sees the message even when they've switched tabs.
 */

import type { InternalVariant } from "./types";

export function shouldFallback(): boolean {
  if (typeof document === "undefined") return false;
  if (typeof Notification === "undefined") return false;
  return document.hidden;
}

let permissionRequested = false;

export function maybeFallbackToNotification(
  message: string,
  variant: InternalVariant,
  title?: string,
): void {
  if (!shouldFallback()) return;

  const fire = () => {
    try {
      new Notification(title ?? `[${variant}]`, {
        body: message,
        tag: "toast-23",
      });
    } catch {
      /* swallow */
    }
  };

  if (Notification.permission === "granted") {
    fire();
    return;
  }

  if (Notification.permission === "default" && !permissionRequested) {
    permissionRequested = true;
    Notification.requestPermission()
      .then((p) => {
        if (p === "granted") fire();
      })
      .catch(() => {
        /* swallow */
      });
  }
}
