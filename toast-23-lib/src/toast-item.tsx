/**
 * toast-23 — Individual Toast Component
 *
 * Manages its own enter / exit CSS transitions and auto-dismiss timer.
 * Progress bar is JS-driven so it can reverse (refill) on hover.
 */

"use client";

import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { InternalToast } from "./types";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  SpinnerIcon,
  XIcon,
} from "./icons";
import { cx } from "./utils";

// ---------------------------------------------------------------------------
// Icon map
// ---------------------------------------------------------------------------

const variantIcon: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
  default: InfoIcon,
  loading: SpinnerIcon,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ToastItemProps {
  toast: InternalToast;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
}

const EXIT_DURATION = 300; // ms — must match CSS transition duration
// const MIN_REFILL_DURATION = 200; // ms — minimum refill time so very short hovers aren't instant

export const ToastItem: React.FC<ToastItemProps> = React.memo(
  ({ toast, onDismiss, onRemove }) => {
    // ----- animation state -----
    const [hasEntered, setHasEntered] = useState(false);

    // Trigger enter transition on next frame
    useEffect(() => {
      const raf = requestAnimationFrame(() => setHasEntered(true));
      return () => cancelAnimationFrame(raf);
    }, []);

    // When the provider marks the toast as exiting, it waits for the CSS
    // transition to finish then actually remove it from state.
    useEffect(() => {
      if (!toast.isExiting) return;
      const delay = toast.removeDelay ?? EXIT_DURATION;
      const timer = setTimeout(() => onRemove(toast.id), delay);
      return () => clearTimeout(timer);
    }, [toast.isExiting, toast.id, toast.removeDelay, onRemove]);

    // ----- auto-dismiss timer with hover-pause -----
    const [isPaused, setIsPaused] = useState(false);
    const remainingRef = useRef(toast.duration);
    // const startRef = useRef(0);

    // ----- JS-driven progress bar -----
    // progress: 100 = full, 0 = empty
    const [progress, setProgress] = useState(100);
    // transition duration for the progress bar
    const [progressTransition, setProgressTransition] = useState("none");
    // const rafRef = useRef<number>(0);

    // Reset remaining time when version changes (e.g. promise resolved)
    useEffect(() => {
      remainingRef.current = toast.duration;
      setProgress(100);
      setProgressTransition("none");
    }, [toast.version, toast.duration]);

    useEffect(() => {
      // Don't auto-dismiss: persistent, loading, still entering, or already exiting
      if (
        toast.duration <= 0 ||
        toast.variant === "loading" ||
        !hasEntered ||
        toast.isExiting
      )
        return;

    //   if (isPaused) {
    //     // How long the bar was shrinking before hover
    //     const elapsed = Date.now() - startRef.current;
    //     // Snapshot remaining time
    //     remainingRef.current = Math.max(0, remainingRef.current - elapsed);

    //     // Reverse at the same speed it was shrinking (proportional duration)
    //     const refillDuration = Math.max(MIN_REFILL_DURATION, elapsed);
    //     setProgressTransition(`width ${refillDuration}ms ease-out`);
    //     setProgress(100);
    //     return;
    //   }

    //   // Start shrinking
    //   startRef.current = Date.now();
    //   const remaining = remainingRef.current;

      // Set transition to match remaining time and shrink to 0
      // Use rAF to ensure the refill transition has settled before starting shrink
    //   rafRef.current = requestAnimationFrame(() => {
    //     setProgressTransition(`width ${remaining}ms linear`);
    //     setProgress(0);
    //   });

    //   const timer = setTimeout(() => {
    //     onDismiss(toast.id);
    //   }, remaining);

    //   return () => {
    //     clearTimeout(timer);
    //     cancelAnimationFrame(rafRef.current);
    //   };
    // }, [
    //   isPaused,
    //   hasEntered,
    //   toast.isExiting,
    //   toast.duration,
    //   toast.variant,
    //   toast.id,
    //   toast.version,
    //   onDismiss,
    // ]);
    if (isPaused) {
    // refill instantly
    setProgressTransition("width 200ms ease-out");
    setProgress(100);
    return;
  }

  // restart shrink animation from full
  setProgress(100);
  requestAnimationFrame(() => {
    setProgressTransition(`width ${toast.duration}ms linear`);
    setProgress(0);
  });

  const timer = setTimeout(() => {
    onDismiss(toast.id);
  }, toast.duration);

  return () => clearTimeout(timer);
}, [
  isPaused,
  toast.duration,
  toast.variant,
  toast.isExiting,
  toast.id,
  hasEntered,
  onDismiss,
]);

    // ----- handlers -----
    const handleMouseEnter = useCallback(() => setIsPaused(true), []);
    const handleMouseLeave = useCallback(() => setIsPaused(false), []);

    // ----- render -----
    const Icon = variantIcon[toast.variant] ?? InfoIcon;

    // Custom toast — render raw content with no default chrome
    if (toast.isCustom) {
      return (
        <div
          className={cx(
            "toast23-item toast23-item--custom",
            !hasEntered && "toast23-item--entering",
            toast.isExiting && "toast23-item--exiting",
          )}
          role="alert"
          aria-live="polite"
          aria-atomic="true"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {toast.message}
        </div>
      );
    }

    return (
      <div
        className={cx(
          "toast23-item",
          `toast23-item--${toast.variant}`,
          !hasEntered && "toast23-item--entering",
          toast.isExiting && "toast23-item--exiting",
        )}
        role="alert"
        aria-live={toast.variant === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Icon */}
        <span className={cx("toast23-icon", `toast23-icon--${toast.variant}`)}>
          <Icon />
        </span>

        {/* Content */}
        <div className="toast23-content">
          {toast.title && <div className="toast23-title">{toast.title}</div>}
          <div
            className={cx(
              "toast23-message",
              toast.title && "toast23-message--with-title",
            )}
          >
            {toast.message}
          </div>
        </div>

        {/* Dismiss button */}
        {toast.dismissible && (
          <button
            type="button"
            className="toast23-dismiss"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss notification"
          >
            <XIcon />
          </button>
        )}

        {/* Progress bar — JS-driven width for hover reversal */}
        {toast.duration > 0 && toast.variant !== "loading" && (
          <div
            className={cx(
              "toast23-progress",
              `toast23-progress--${toast.variant}`,
            )}
            style={{
              width: `${progress}%`,
              transition: progressTransition,
            }}
          />
        )}
      </div>
    );
  },
);

ToastItem.displayName = "ToastItem";
