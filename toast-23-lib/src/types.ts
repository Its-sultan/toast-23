/**
 * toast-23 — Type Definitions
 *
 * All public and internal types used throughout the library.
 */

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Public types (re-exported from index.ts)
// ---------------------------------------------------------------------------

/** Visual variant of a toast notification. */
export type ToastVariant = "success" | "error" | "warning" | "info" | "default";

/** Screen position where toasts are rendered. */
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

/** Options accepted when creating a toast. */
export interface ToastOptions {
  /** Provide a fixed id to update an existing toast or prevent duplicates. */
  id?: string;
  /** Optional heading displayed above the message. */
  title?: string;
  /** Visual variant. Defaults to `"default"`. */
  variant?: ToastVariant;
  /** Auto-dismiss duration in ms. `0` = persistent. Defaults to provider value. */
  duration?: number;
  /** Screen position override. Defaults to provider value. */
  position?: ToastPosition;
  /** Whether the user can manually dismiss the toast. Defaults to `true`. */
  dismissible?: boolean;
  /** Delay in ms before removing from DOM after dismiss (for exit animation). @default 1000 */
  removeDelay?: number;
}

/** Options for `toast.promise()`. */
export interface PromiseOptions<T> {
  /** Message shown while the promise is pending. */
  loading: string;
  /** Message on fulfillment. Can be a function receiving the resolved value. */
  success: string | ((data: T) => string);
  /** Message on rejection. Can be a function receiving the error. */
  error: string | ((err: unknown) => string);
}

/**
 * The callable toast API returned by `useToast()`.
 *
 * Can be invoked directly — `toast("hi")` — or via variant helpers.
 */
export interface ToastApi {
  (message: string | ReactNode, options?: ToastOptions): string;
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  warning: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  info: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Show a loading toast. Returns the toast id for later update. */
  loading: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Show a custom toast with JSX content and no default styles. */
  custom: (
    content: ReactNode,
    options?: Omit<ToastOptions, "variant">,
  ) => string;
  /** Tracks an async operation with loading → success / error transitions. */
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T>,
    toastOptions?: ToastOptions,
  ) => Promise<T>;
  /** Manually dismisses a toast by id. Omits id to dismiss all. */
  dismiss: (id?: string) => void;
  /** Instantly removes a toast from DOM (no exit animation). Omits id to remove all. */
  remove: (id?: string) => void;
}

/** Props for `<Toast23Provider>`. */
export interface Toast23ProviderProps {
  children: ReactNode;
  /** Maximum number of simultaneously visible toasts. @default 5 */
  maxVisible?: number;
  /** Default position on screen. @default "top-right" */
  position?: ToastPosition;
  /** Default auto-dismiss duration in ms. @default 5000 */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Internal types (not exported from public API)
// ---------------------------------------------------------------------------

/** Extended variant that includes the internal "loading" state. */
export type InternalVariant = ToastVariant | "loading";

/** Full internal representation of a toast stored in state. */
export interface InternalToast {
  id: string;
  message: string | ReactNode;
  title?: string;
  variant: InternalVariant;
  duration: number;
  position: ToastPosition;
  dismissible: boolean;
  /** Delay in ms before DOM removal after dismiss (exit animation time). */
  removeDelay: number;
  /** True once the provider has started the exit animation. */
  isExiting: boolean;
  /** Epoch timestamp when the toast was created. */
  createdAt: number;
  /** Increments on update — used to reset progress bar animation. */
  version: number;
  /** When true, renders as a custom toast with no default styling. */
  isCustom?: boolean;
}

/** Reducer action types. */
export type ToasterAction =
  | { type: "ADD"; toast: InternalToast }
  | { type: "UPDATE"; id: string; updates: Partial<InternalToast> }
  | { type: "DISMISS"; id?: string }
  | { type: "REMOVE"; id?: string }
  | { type: "UPSERT"; toast: InternalToast };

/** Shape of the internal context value. */
export interface ToasterContextValue {
  addToast: (
    message: string | ReactNode,
    options?: ToastOptions & { isCustom?: boolean },
  ) => string;
  updateToast: (
    id: string,
    updates: Partial<
      Pick<
        InternalToast,
        "message" | "title" | "variant" | "duration" | "dismissible"
      >
    >,
  ) => void;
  dismissToast: (id?: string) => void;
  removeToast: (id?: string) => void;
  config: {
    maxVisible: number;
    position: ToastPosition;
    duration: number;
  };
}
