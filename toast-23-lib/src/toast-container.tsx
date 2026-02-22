/**
 * toast-23 — Positioned Toast Container
 *
 * Renders a group of toasts for a given screen position.
 * Handles queue logic: only `maxVisible` non-exiting toasts are shown,
 * plus any currently animating-out toasts.
 */

"use client";

import * as React from "react";
import { useContext } from "react";
import type { InternalToast, ToastPosition } from "./types";
import { ToasterContext } from "./context";
import { ToastItem } from "./toast-item";
import { cx } from "./utils";

interface ToastContainerProps {
  position: ToastPosition;
  toasts: InternalToast[];
  maxVisible: number;
}

export const ToastContainer: React.FC<ToastContainerProps> = React.memo(
  ({ position, toasts, maxVisible }: ToastContainerProps) => {
    const ctx = useContext(ToasterContext);
    if (!ctx) return null;

    // Separate actives vs. exiting toasts
    const active = toasts.filter((t) => !t.isExiting);
    const exiting = toasts.filter((t) => t.isExiting);

    // Only shows up to maxVisible active toasts, plus all currently exiting
    const visible = [...active.slice(0, maxVisible), ...exiting];

    if (visible.length === 0) return null;

    // Queue count for optional badge
    const queuedCount = Math.max(0, active.length - maxVisible);

    return (
      <div
        className={cx("toast23-container", `toast23-container--${position}`)}
        aria-label="Notifications"
        role="region"
      >
        {visible.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={ctx.dismissToast}
            onRemove={ctx.removeToast}
          />
        ))}
        {queuedCount > 0 && (
          <div className="toast23-queue-badge" aria-live="polite">
            +{queuedCount} more
          </div>
        )}
      </div>
    );
  },
);

ToastContainer.displayName = "ToastContainer";
