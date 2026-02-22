/**
 * toast-23 — Toast23Provider
 *
 * Wrap your application with this provider to enable toast notifications.
 *
 * ```tsx
 * <Toast23Provider position="top-right" maxVisible={5}>
 *   <App />
 * </Toast23Provider>
 * ```
 */

"use client";

import { useCallback, useMemo, useReducer } from "react";
import type {
  InternalToast,
  Toast23ProviderProps,
  ToasterContextValue,
  ToastOptions,
  ToastPosition,
} from "./types";
import type { ReactNode } from "react";
import { ToasterContext, toasterReducer } from "./context";
import { ToastContainer } from "./toast-container";
import { generateId } from "./utils";

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
  position: defaultPosition = "top-right" as ToastPosition,
  duration: defaultDuration = 5000,
}) => {
  const [toasts, dispatch] = useReducer(toasterReducer, []);

  // ------ stable callbacks (dispatch is always stable from useReducer) ------

  const addToast = useCallback(
    (message: string | ReactNode, options?: ToastOptions & { variant?: any; isCustom?: boolean }): string => {
      const id = options?.id ?? generateId();
      const toast: InternalToast = {
        id,
        message,
        title: options?.title,
        variant: options?.variant ?? "default",
        duration: options?.duration ?? defaultDuration,
        position: options?.position ?? defaultPosition,
        dismissible: options?.dismissible ?? true,
        removeDelay: options?.removeDelay ?? 1000,
        isExiting: false,
        createdAt: Date.now(),
        version: 0,
        isCustom: options?.isCustom,
      };
      // If an id is provided, upsert (update-or-insert)
      if (options?.id) {
        dispatch({ type: "UPSERT", toast });
      } else {
        dispatch({ type: "ADD", toast });
      }
      return id;
    },
    [defaultDuration, defaultPosition],
  );

  const updateToast = useCallback(
    (
      id: string,
      updates: Partial<
        Pick<
          InternalToast,
          "message" | "title" | "variant" | "duration" | "dismissible"
        >
      >,
    ) => {
      dispatch({ type: "UPDATE", id, updates });
    },
    [],
  );

  const dismissToast = useCallback((id?: string) => {
    dispatch({ type: "DISMISS", id });
  }, []);

  const removeToast = useCallback((id?: string) => {
    dispatch({ type: "REMOVE", id });
  }, []);

  // ------ context value (stable as long as callbacks are stable) ------

  const contextValue: ToasterContextValue = useMemo(
    () => ({
      addToast,
      updateToast,
      dismissToast,
      removeToast,
      config: {
        maxVisible,
        position: defaultPosition,
        duration: defaultDuration,
      },
    }),
    [
      addToast,
      updateToast,
      dismissToast,
      removeToast,
      maxVisible,
      defaultPosition,
      defaultDuration,
    ],
  );

  // ------ group toasts by position ------

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
      groups[t.position].push(t);
    }
    return groups;
  }, [toasts]);

  return (
    <ToasterContext.Provider value={contextValue}>
      {children}

      {/* Render one container per position that has toasts */}
      {ALL_POSITIONS.map((pos) =>
        groupedToasts[pos].length > 0 ? (
          <ToastContainer
            key={pos}
            position={pos}
            toasts={groupedToasts[pos]}
            maxVisible={maxVisible}
          />
        ) : null,
      )}
    </ToasterContext.Provider>
  );
};

Toast23Provider.displayName = "Toast23Provider";
