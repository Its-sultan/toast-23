/**
 * toast-23 — Toast23Provider
 */

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import type {
  InternalToast,
  Toast23ProviderProps,
  ToasterContextValue,
  ToastHistoryEntry,
  ToastOptions,
  ToastPosition,
  InternalVariant,
} from "./types";
import type { ReactNode } from "react";
import { ToasterContext, toasterReducer } from "./context";
import { ToastContainer } from "./toast-container";
import { generateId } from "./utils";
import { injectStyles } from "./inject-styles";
import { playToastSound } from "./sound";
import { maybeFallbackToNotification } from "./notification";
import { createHeadlessStore } from "./headless-store";
import type { HeadlessStore } from "./types";

injectStyles();

const ALL_POSITIONS: ToastPosition[] = [
  "top-right",
  "top-left",
  "top-center",
  "bottom-right",
  "bottom-left",
  "bottom-center",
];

export const Toast23Provider: React.FC<Toast23ProviderProps> = ({
  children,
  maxVisible = 5,
  position: defaultPosition = "top-right",
  duration: defaultDuration = 5000,
  layout = "default",
  dir = "ltr",
  theme = "auto",
  target = null,
  historySize = 50,
  focusShortcut = "F8",
  swipeThreshold = 80,
  swipeEnabled = true,
  sound: defaultSound = false,
  fallbackToNotification: defaultFallback = false,
}) => {
  const [toasts, dispatch] = useReducer(toasterReducer, []);
  const [isPausedGlobally, setIsPausedGlobally] = useState(false);

  // Latest toasts mirrored into a ref so the dismiss/remove callbacks can read
  // current state without listing `toasts` in their dependency arrays. That
  // keeps their identity stable — otherwise every queue change would hand each
  // ToastItem a new `onDismiss`/`onRemove`, restarting its auto-dismiss timer
  // and snapping the progress bar back to full.
  const toastsRef = useRef(toasts);
  toastsRef.current = toasts;

  // Per-provider headless store — created once. Isolating it here (rather than
  // a module global) keeps multiple providers / standalone instances separate.
  const headlessStoreRef = useRef<HeadlessStore>();
  if (!headlessStoreRef.current) {
    headlessStoreRef.current = createHeadlessStore();
  }
  const headlessStore = headlessStoreRef.current;

  // History ring buffer — stored in a ref so it doesn't trigger re-renders.
  const historyRef = useRef<ToastHistoryEntry[]>([]);

  // Deduplicate history entries — a toast can hit the dismiss path more than
  // once (manual dismiss → exit animation → timer cleanup), and we want it
  // logged exactly once. Ids are pruned when a toast is removed so the set
  // tracks only live toasts rather than growing for the lifetime of the app.
  const dismissedIdsRef = useRef<Set<string>>(new Set());

  const recordHistory = useCallback(
    (t: InternalToast) => {
      if (dismissedIdsRef.current.has(t.id)) return;
      dismissedIdsRef.current.add(t.id);
      const entry: ToastHistoryEntry = {
        id: t.id,
        message: t.message,
        title: t.title,
        variant: t.variant === "loading" ? "info" : t.variant,
        dismissedAt: Date.now(),
        group: t.group,
      };
      historyRef.current = [entry, ...historyRef.current].slice(0, historySize);
      // Fire user-supplied onDismiss callback exactly once per toast.
      if (t.onDismiss) {
        try {
          t.onDismiss();
        } catch {
          /* swallow user errors */
        }
      }
    },
    [historySize],
  );

  const addToast = useCallback(
    (
      message: string | ReactNode,
      options?: Omit<ToastOptions, "variant"> & {
        variant?: InternalVariant;
        isCustom?: boolean;
      },
    ): string => {
      const id = options?.id ?? generateId();
      const variant: InternalVariant = options?.variant ?? "default";
      const toast: InternalToast = {
        id,
        message,
        title: options?.title,
        variant,
        duration: options?.duration ?? defaultDuration,
        position: options?.position ?? defaultPosition,
        dismissible: options?.dismissible ?? true,
        removeDelay: options?.removeDelay ?? 300,
        isExiting: false,
        createdAt: Date.now(),
        version: 0,
        isCustom: options?.isCustom,
        action: options?.action,
        cancelAction: options?.cancelAction,
        onDismiss: options?.onDismiss,
        group: options?.group,
        sound: options?.sound ?? defaultSound,
        fallbackToNotification:
          options?.fallbackToNotification ?? defaultFallback,
      };

      if (options?.id) dispatch({ type: "UPSERT", toast });
      else dispatch({ type: "ADD", toast });

      // Side effects: sound + browser notification fallback
      if (toast.sound) playToastSound(variant);
      if (toast.fallbackToNotification && typeof message === "string") {
        maybeFallbackToNotification(message, variant, toast.title);
      }

      return id;
    },
    [defaultDuration, defaultPosition, defaultSound, defaultFallback],
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<InternalToast>) => {
      dispatch({ type: "UPDATE", id, updates });
    },
    [],
  );

  const dismissToast = useCallback(
    (id?: string) => {
      // Record history before dispatching
      if (id) {
        const t = toastsRef.current.find((x) => x.id === id);
        if (t) recordHistory(t);
      } else {
        toastsRef.current.forEach(recordHistory);
      }
      dispatch({ type: "DISMISS", id });
    },
    [recordHistory],
  );

  const removeToast = useCallback(
    (id?: string) => {
      if (id) {
        const t = toastsRef.current.find((x) => x.id === id);
        if (t) recordHistory(t);
        dispatch({ type: "REMOVE", id });
        // Toast is gone — drop its dedup entry so a reused id can log again.
        dismissedIdsRef.current.delete(id);
      } else {
        toastsRef.current.forEach(recordHistory);
        dispatch({ type: "REMOVE", id });
        dismissedIdsRef.current.clear();
      }
    },
    [recordHistory],
  );

  const dismissGroup = useCallback(
    (group: string) => {
      toastsRef.current
        .filter((t) => t.group === group)
        .forEach(recordHistory);
      dispatch({ type: "DISMISS_GROUP", group });
    },
    [recordHistory],
  );

  const removeGroup = useCallback(
    (group: string) => {
      const inGroup = toastsRef.current.filter((t) => t.group === group);
      inGroup.forEach(recordHistory);
      dispatch({ type: "REMOVE_GROUP", group });
      for (const t of inGroup) dismissedIdsRef.current.delete(t.id);
    },
    [recordHistory],
  );

  const pauseAll = useCallback(() => setIsPausedGlobally(true), []);
  const resumeAll = useCallback(() => setIsPausedGlobally(false), []);
  const history = useCallback(() => historyRef.current, []);

  const contextValue: ToasterContextValue = useMemo(
    () => ({
      addToast,
      updateToast,
      dismissToast,
      removeToast,
      dismissGroup,
      removeGroup,
      pauseAll,
      resumeAll,
      history,
      headlessStore,
      config: {
        maxVisible,
        position: defaultPosition,
        duration: defaultDuration,
        layout,
        dir,
        theme,
        swipeThreshold,
        swipeEnabled,
        sound: defaultSound,
        fallbackToNotification: defaultFallback,
      },
      isPausedGlobally,
    }),
    [
      addToast,
      updateToast,
      dismissToast,
      removeToast,
      dismissGroup,
      removeGroup,
      pauseAll,
      resumeAll,
      history,
      headlessStore,
      maxVisible,
      defaultPosition,
      defaultDuration,
      layout,
      dir,
      theme,
      swipeThreshold,
      swipeEnabled,
      defaultSound,
      defaultFallback,
      isPausedGlobally,
    ],
  );

  // Publish current state to this provider's headless store on every render.
  useEffect(() => {
    headlessStore.publish(toasts);
  }, [toasts, headlessStore]);

  // Keyboard shortcut to focus first toast container.
  useEffect(() => {
    if (!focusShortcut || typeof window === "undefined") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== focusShortcut) return;
      const region = document.querySelector<HTMLElement>(
        '[data-toast23-region="true"]',
      );
      if (region) {
        e.preventDefault();
        region.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusShortcut]);

  // Group toasts by position.
  const groupedToasts = useMemo(() => {
    const groups: Record<ToastPosition, InternalToast[]> = {
      "top-right": [],
      "top-left": [],
      "top-center": [],
      "bottom-right": [],
      "bottom-left": [],
      "bottom-center": [],
    };
    for (const t of toasts) {
      const bucket = groups[t.position] ?? groups[defaultPosition];
      bucket.push(t);
    }
    return groups;
  }, [toasts, defaultPosition]);

  const containers = (
    <>
      {ALL_POSITIONS.map((pos) =>
        groupedToasts[pos].length > 0 ? (
          <ToastContainer
            key={pos}
            position={pos}
            toasts={groupedToasts[pos]}
            maxVisible={maxVisible}
            layout={layout}
            dir={dir}
            theme={theme}
            inline={target !== null && target !== undefined}
          />
        ) : null,
      )}
    </>
  );

  // Portal target: explicit `target` (inline mode) wins, otherwise document.body.
  const portalTarget =
    target ??
    (typeof document !== "undefined" ? document.body : null);

  return (
    <ToasterContext.Provider value={contextValue}>
      {children}
      {portalTarget ? createPortal(containers, portalTarget) : containers}
    </ToasterContext.Provider>
  );
};

Toast23Provider.displayName = "Toast23Provider";
