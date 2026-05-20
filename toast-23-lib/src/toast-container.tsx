/**
 * toast-23 — Positioned Toast Container
 */

"use client";

import * as React from "react";
import { useContext, useState, useCallback } from "react";
import type {
  InternalToast,
  ToastDirection,
  ToastLayout,
  ToastPosition,
  ToastTheme,
} from "./types";
import { ToasterContext } from "./context";
import { ToastItem } from "./toast-item";
import { cx } from "./utils";

interface ToastContainerProps {
  position: ToastPosition;
  toasts: InternalToast[];
  maxVisible: number;
  layout: ToastLayout;
  dir: ToastDirection;
  theme: ToastTheme;
  inline: boolean;
}

export const ToastContainer: React.FC<ToastContainerProps> = React.memo(
  ({ position, toasts, maxVisible, layout, dir, theme, inline }) => {
    const ctx = useContext(ToasterContext);
    const [isExpanded, setIsExpanded] = useState(false);

    const onContainerEnter = useCallback(() => setIsExpanded(true), []);
    const onContainerLeave = useCallback(() => setIsExpanded(false), []);

    if (!ctx) return null;

    const active = toasts.filter((t) => !t.isExiting);
    const exiting = toasts.filter((t) => t.isExiting);
    const visible = [...active.slice(0, maxVisible), ...exiting];
    const queuedCount = Math.max(0, active.length - maxVisible);

    if (visible.length === 0) return null;

    // For stack layout, compute z-index + transform offsets per index.
    // Newest-first index, so first toast is "on top" in the stack.
    const stackMode = layout === "stack";
    const isBottom = position.startsWith("bottom");

    return (
      <div
        className={cx(
          "toast23-container",
          `toast23-container--${position}`,
          stackMode && "toast23-container--stack",
          stackMode && isExpanded && "toast23-container--expanded",
          inline && "toast23-container--inline",
          dir === "rtl" && "toast23-container--rtl",
          theme === "dark" && "toast23-container--dark",
          theme === "light" && "toast23-container--light",
        )}
        dir={dir}
        aria-label="Notifications"
        role="region"
        tabIndex={-1}
        data-toast23-region="true"
        onMouseEnter={stackMode ? onContainerEnter : undefined}
        onMouseLeave={stackMode ? onContainerLeave : undefined}
      >
        {visible.map((toast, i) => {
          // Determine stack index: 0 = front. Bottom positions invert visually
          // because the container is flex-column-reverse, but we still want
          // index 0 to be the "front" toast in stack mode.
          const stackIndex = stackMode ? i : 0;
          return (
            <ToastItem
              key={toast.id}
              toast={toast}
              stackIndex={stackIndex}
              stackMode={stackMode}
              stackExpanded={isExpanded}
              stackIsBottom={isBottom}
              dir={dir}
              onDismiss={ctx.dismissToast}
              onRemove={ctx.removeToast}
              globallyPaused={ctx.isPausedGlobally}
              swipeEnabled={ctx.config.swipeEnabled}
              swipeThreshold={ctx.config.swipeThreshold}
            />
          );
        })}
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
