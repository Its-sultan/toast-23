/**
 * toast-23 — Individual Toast Component
 *
 * Hover behavior (by design): hovering REFILLS the progress bar to 100% and
 * pauses the dismiss timer. Unhovering restarts the countdown from 100% over
 * the full duration.
 *
 * Progress bar uses `transform: scaleX()` for GPU-accelerated animation.
 * If `toast.progress` is set (0..1), the bar shows that determinate value
 * instead of the auto-shrink animation.
 */

"use client";

import * as React from "react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { InternalToast, ToastDirection } from "./types";
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon,
  SpinnerIcon,
  XIcon,
} from "./icons";
import { cx, getSwipeDirection } from "./utils";

const variantIcon: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  success: CheckCircleIcon,
  error: XCircleIcon,
  warning: AlertTriangleIcon,
  info: InfoIcon,
  default: InfoIcon,
  loading: SpinnerIcon,
};

const REFILL_DURATION = 200;
// Off-screen fling animation when a swipe crosses the dismiss threshold. The
// dismiss is fired only after it completes so the toast doesn't pop early.
const SWIPE_FLING_DURATION = 180;

interface ToastItemProps {
  toast: InternalToast;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
  globallyPaused: boolean;
  swipeEnabled: boolean;
  swipeThreshold: number;
  stackIndex: number;
  stackMode: boolean;
  stackExpanded: boolean;
  stackIsBottom: boolean;
  dir: ToastDirection;
}

export const ToastItem: React.FC<ToastItemProps> = React.memo(
  ({
    toast,
    onDismiss,
    onRemove,
    globallyPaused,
    swipeEnabled,
    swipeThreshold,
    stackIndex,
    stackMode,
    stackExpanded,
    stackIsBottom,
    dir: _dir,
  }) => {
    const [hasEntered, setHasEntered] = useState(false);
    useEffect(() => {
      const raf = requestAnimationFrame(() => setHasEntered(true));
      return () => cancelAnimationFrame(raf);
    }, []);

    // Exit/remove: wait `removeDelay` then unmount.
    useEffect(() => {
      if (!toast.isExiting) return;
      const timer = setTimeout(() => onRemove(toast.id), toast.removeDelay);
      return () => clearTimeout(timer);
    }, [toast.isExiting, toast.id, toast.removeDelay, onRemove]);

    // ----- Hover (restart-on-hover) -----
    const [isHovered, setIsHovered] = useState(false);
    const isPaused = isHovered || globallyPaused;

    // ----- Progress bar -----
    const [progress, setProgress] = useState(1);
    const [progressTransition, setProgressTransition] = useState("none");

    // Reset progress on version change (e.g. promise resolved).
    useEffect(() => {
      setProgress(1);
      setProgressTransition("none");
    }, [toast.version, toast.duration]);

    // Determinate progress override (toast.progress 0..1) — short-circuit
    // the auto-shrink effect when present.
    const hasDeterminateProgress = typeof toast.progress === "number";

    useEffect(() => {
      if (!hasDeterminateProgress) return;
      setProgressTransition("transform 120ms linear");
      setProgress(toast.progress ?? 0);
    }, [toast.progress, hasDeterminateProgress]);

    // Auto-dismiss timer + bar shrink/refill animation.
    useEffect(() => {
      if (
        hasDeterminateProgress ||
        toast.duration <= 0 ||
        toast.variant === "loading" ||
        !hasEntered ||
        toast.isExiting
      ) {
        return;
      }

      if (isPaused) {
        setProgressTransition(`transform ${REFILL_DURATION}ms ease-out`);
        setProgress(1);
        return;
      }

      setProgressTransition("none");
      setProgress(1);
      const raf = requestAnimationFrame(() => {
        setProgressTransition(`transform ${toast.duration}ms linear`);
        setProgress(0);
      });
      const timer = setTimeout(() => onDismiss(toast.id), toast.duration);

      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }, [
      isPaused,
      hasEntered,
      toast.isExiting,
      toast.duration,
      toast.variant,
      toast.id,
      toast.version,
      hasDeterminateProgress,
      onDismiss,
    ]);

    // ----- Swipe-to-dismiss -----
    const swipeRef = useRef({
      startX: 0,
      startY: 0,
      dx: 0,
      isDragging: false,
      pointerId: -1,
    });
    const [swipeDx, setSwipeDx] = useState(0);
    const [swipeTransition, setSwipeTransition] = useState("");

    const swipeAxis = getSwipeDirection(toast.position);

    const onPointerDown = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!swipeEnabled) return;
        // Only main button (mouse) or touch
        if (e.button !== undefined && e.button !== 0) return;
        const target = e.target as HTMLElement;
        // Don't start swipe when interacting with a button (dismiss/action).
        if (target.closest("button")) return;
        swipeRef.current.startX = e.clientX;
        swipeRef.current.startY = e.clientY;
        swipeRef.current.dx = 0;
        swipeRef.current.isDragging = true;
        swipeRef.current.pointerId = e.pointerId;
        setSwipeTransition("");
      },
      [swipeEnabled],
    );

    const onPointerMove = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!swipeRef.current.isDragging) return;
        if (e.pointerId !== swipeRef.current.pointerId) return;
        const dx = e.clientX - swipeRef.current.startX;
        const dy = e.clientY - swipeRef.current.startY;
        // Ignore primarily-vertical drags so users can scroll.
        if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) return;
        // Constrain to allowed direction.
        const constrained =
          swipeAxis === 0
            ? dx
            : swipeAxis === 1
              ? Math.max(0, dx)
              : Math.min(0, dx);
        swipeRef.current.dx = constrained;
        setSwipeDx(constrained);
      },
      [swipeAxis],
    );

    const onPointerEnd = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!swipeRef.current.isDragging) return;
        if (e.pointerId !== swipeRef.current.pointerId) return;
        swipeRef.current.isDragging = false;
        const dx = swipeRef.current.dx;
        const dismissed = Math.abs(dx) >= swipeThreshold;
        if (dismissed) {
          // Fling off-screen
          setSwipeTransition(
            `transform ${SWIPE_FLING_DURATION}ms ease-out, opacity ${SWIPE_FLING_DURATION}ms ease-out`,
          );
          setSwipeDx(dx > 0 ? window.innerWidth : -window.innerWidth);
          setTimeout(() => onDismiss(toast.id), SWIPE_FLING_DURATION);
        } else {
          // Snap back
          setSwipeTransition("transform 180ms ease-out");
          setSwipeDx(0);
        }
      },
      [swipeThreshold, onDismiss, toast.id],
    );

    // ----- Stack-mode offsets -----
    // Each toast behind the front one is translated + scaled.
    const STACK_OFFSET = 10; // px per layer
    const STACK_SCALE_STEP = 0.06; // shrink per layer
    const STACK_MAX_LAYERS = 3;
    const stackDepth = Math.min(stackIndex, STACK_MAX_LAYERS);

    const stackTransform = (() => {
      if (!stackMode) return "";
      if (stackExpanded) return ""; // expanded → no offset
      const dirY = stackIsBottom ? 1 : -1;
      const offsetY = dirY * stackDepth * STACK_OFFSET;
      const scale = 1 - stackDepth * STACK_SCALE_STEP;
      return `translateY(${offsetY}px) scale(${scale})`;
    })();

    const stackOpacity = stackMode && !stackExpanded && stackDepth > 0
      ? Math.max(0.4, 1 - stackDepth * 0.25)
      : undefined;

    // Combine swipe + stack transforms (swipe wins when active)
    const wrapperTransform = swipeDx !== 0
      ? `translateX(${swipeDx}px)`
      : stackTransform;

    const swipeOpacity = swipeDx !== 0
      ? Math.max(0, 1 - Math.abs(swipeDx) / (swipeThreshold * 2))
      : undefined;

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);

    const Icon = variantIcon[toast.variant] ?? InfoIcon;

    // ----- Action button -----
    const dismissSelf = useCallback(
      () => onDismiss(toast.id),
      [onDismiss, toast.id],
    );

    const handleActionClick = useCallback(() => {
      if (!toast.action) return;
      const shouldDismiss = toast.action.dismissOnClick !== false;
      toast.action.onClick(dismissSelf);
      if (shouldDismiss) dismissSelf();
    }, [toast.action, dismissSelf]);

    const handleCancelClick = useCallback(() => {
      if (!toast.cancelAction) return;
      const shouldDismiss = toast.cancelAction.dismissOnClick !== false;
      toast.cancelAction.onClick(dismissSelf);
      if (shouldDismiss) dismissSelf();
    }, [toast.cancelAction, dismissSelf]);

    // Custom toast — render raw content, no chrome.
    if (toast.isCustom) {
      return (
        <div
          className={cx(
            "toast23-item toast23-item--custom",
            !hasEntered && "toast23-item--entering",
            toast.isExiting && "toast23-item--exiting",
          )}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            transform: wrapperTransform || undefined,
            opacity: swipeOpacity ?? stackOpacity,
            transition: swipeTransition || undefined,
            pointerEvents: stackMode && !stackExpanded && stackDepth > 0
              ? "none"
              : undefined,
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {toast.message}
        </div>
      );
    }

    // Toasts with both an action and a cancel use the confirm layout (styled
    // in CSS): buttons stack below the message, dismiss × in the corner.
    const isConfirmLayout = !!(toast.action && toast.cancelAction);

    return (
      <div
        className={cx(
          "toast23-item",
          `toast23-item--${toast.variant}`,
          !hasEntered && "toast23-item--entering",
          toast.isExiting && "toast23-item--exiting",
          stackMode && "toast23-item--stack",
          isConfirmLayout && "toast23-item--confirm",
        )}
        role={toast.variant === "error" ? "alert" : "status"}
        aria-live={toast.variant === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        style={{
          transform: wrapperTransform || undefined,
          opacity: swipeOpacity ?? stackOpacity,
          transition: swipeTransition || undefined,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <span className={cx("toast23-icon", `toast23-icon--${toast.variant}`)}>
          <Icon />
        </span>

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

        {(toast.action || toast.cancelAction) && (
          <div className="toast23-actions">
            {toast.cancelAction && (
              <button
                type="button"
                className={cx(
                  "toast23-action toast23-action--cancel",
                  toast.cancelAction.className,
                )}
                onClick={handleCancelClick}
              >
                {toast.cancelAction.label}
              </button>
            )}
            {toast.action && (
              <button
                type="button"
                className={cx("toast23-action", toast.action.className)}
                onClick={handleActionClick}
              >
                {toast.action.label}
              </button>
            )}
          </div>
        )}

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

        {(toast.duration > 0 || hasDeterminateProgress) &&
          toast.variant !== "loading" && (
            <div
              className={cx(
                "toast23-progress",
                `toast23-progress--${toast.variant}`,
              )}
              style={{
                transform: `scaleX(${progress})`,
                transition: progressTransition,
              }}
            />
          )}
      </div>
    );
  },
);

ToastItem.displayName = "ToastItem";
