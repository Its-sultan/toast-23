/**
 * toast-23 — Type Definitions
 */

import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ToastVariant = "success" | "error" | "warning" | "info" | "default";

export type ToastPosition =
  | "top-right"
  | "top-left"
  | "top-center"
  | "bottom-right"
  | "bottom-left"
  | "bottom-center";

/** Layout direction. Affects slide direction and progress-bar origin. */
export type ToastDirection = "ltr" | "rtl";

/** Color theme. `auto` follows `prefers-color-scheme`. */
export type ToastTheme = "auto" | "light" | "dark";

/** Action button rendered inside a toast. */
export interface ToastAction {
  label: ReactNode;
  /** Called when clicked. Receives a `dismiss` helper so the toast can be closed. */
  onClick: (dismiss: () => void) => void;
  /** Whether clicking the button auto-dismisses the toast. @default true */
  dismissOnClick?: boolean;
  /** Optional className for custom styling. */
  className?: string;
}

export interface ToastOptions {
  id?: string;
  title?: string;
  variant?: ToastVariant;
  duration?: number;
  position?: ToastPosition;
  dismissible?: boolean;
  /** Delay in ms before removing from DOM after dismiss. @default 300 */
  removeDelay?: number;
  /** Action button (e.g. Undo). */
  action?: ToastAction;
  /** Secondary action button — typically used for cancel/decline. */
  cancelAction?: ToastAction;
  /** Called when the toast leaves state (dismissed manually, by timer, or programmatically). */
  onDismiss?: () => void;
  /** Group identifier — used by `dismissGroup` / `removeGroup`. */
  group?: string;
  /** Play a sound on display. Boolean uses default tone; string is variant override. @default false */
  sound?: boolean;
  /**
   * Fallback to an OS notification when the document is hidden. The first time
   * a hidden-tab toast fires with this enabled, the browser's notification
   * permission prompt may be shown. @default false
   */
  fallbackToNotification?: boolean;
}

export interface PromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((err: unknown) => string);
  /**
   * Optional progress reporter. Returns a function the caller invokes with a
   * value 0..1 to update a determinate progress bar.
   */
  progress?: (report: (pct: number) => void) => void;
}

export interface ConfirmOptions {
  /** Label for the confirm button. @default "Confirm" */
  confirmLabel?: ReactNode;
  /** Label for the cancel button. @default "Cancel" */
  cancelLabel?: ReactNode;
  /** Variant of the toast. @default "warning" */
  variant?: ToastVariant;
  /** Title shown above the message. */
  title?: string;
  /** Position override. */
  position?: ToastPosition;
}

/** The callable toast API. */
export interface ToastApi {
  (message: string | ReactNode, options?: ToastOptions): string;
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  warning: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  info: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  loading: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  custom: (
    content: ReactNode,
    options?: Omit<ToastOptions, "variant">,
  ) => string;
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T>,
    toastOptions?: ToastOptions,
  ) => Promise<T>;
  /** Confirmation toast — resolves with `true` (confirm) or `false` (cancel/dismiss). */
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  dismiss: (id?: string) => void;
  remove: (id?: string) => void;
  /** Dismiss every toast in a group. */
  dismissGroup: (group: string) => void;
  /** Remove (instantly) every toast in a group. */
  removeGroup: (group: string) => void;
  /** Pauses every active toast's timer. */
  pauseAll: () => void;
  /** Resumes timers paused via `pauseAll`. */
  resumeAll: () => void;
  /** Read the history of dismissed toasts (newest first). */
  history: () => ReadonlyArray<ToastHistoryEntry>;
}

/** Layout mode for the toast column. */
export type ToastLayout = "default" | "stack";

export interface Toast23ProviderProps {
  children: ReactNode;
  maxVisible?: number;
  position?: ToastPosition;
  duration?: number;
  /** Layout mode. `stack` collapses background toasts and expands on hover. @default "default" */
  layout?: ToastLayout;
  /** Layout direction. @default "ltr" */
  dir?: ToastDirection;
  /**
   * Force a color theme. `"auto"` follows the OS `prefers-color-scheme` and
   * any ancestor `.dark` class. Use `"dark"` or `"light"` when toasts portal
   * outside the consumer's theme wrapper. @default "auto"
   */
  theme?: ToastTheme;
  /** Where to render the toast portal. `null` = `document.body`. Pass an element for inline mode. */
  target?: HTMLElement | null;
  /** Number of dismissed toasts to retain in history. @default 50 */
  historySize?: number;
  /** Keyboard shortcut to focus the toast container. @default "F8" — set to null to disable */
  focusShortcut?: string | null;
  /** Swipe distance (px) past which a swipe dismisses the toast. @default 80 */
  swipeThreshold?: number;
  /** Whether swipe-to-dismiss is enabled. @default true */
  swipeEnabled?: boolean;
  /** Default `sound` option applied to every toast. @default false */
  sound?: boolean;
  /** Default `fallbackToNotification` for every toast. @default false */
  fallbackToNotification?: boolean;
}

/** Single entry in the dismissed-toast history log. */
export interface ToastHistoryEntry {
  id: string;
  message: string | ReactNode;
  title?: string;
  variant: ToastVariant;
  dismissedAt: number;
  group?: string;
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

export type InternalVariant = ToastVariant | "loading";

export interface InternalToast {
  id: string;
  message: string | ReactNode;
  title?: string;
  variant: InternalVariant;
  duration: number;
  position: ToastPosition;
  dismissible: boolean;
  removeDelay: number;
  isExiting: boolean;
  createdAt: number;
  version: number;
  isCustom?: boolean;
  action?: ToastAction;
  cancelAction?: ToastAction;
  onDismiss?: () => void;
  group?: string;
  sound?: boolean;
  fallbackToNotification?: boolean;
  /** Determinate progress value 0..1, or undefined for indeterminate. */
  progress?: number;
}

/**
 * Per-provider external store backing the headless hook and DevTools.
 * Created by each provider so multiple providers/instances stay isolated.
 */
export interface HeadlessStore {
  publish: (next: ReadonlyArray<InternalToast>) => void;
  getSnapshot: () => ReadonlyArray<InternalToast>;
  subscribe: (listener: () => void) => () => void;
}

export type ToasterAction =
  | { type: "ADD"; toast: InternalToast }
  | { type: "UPDATE"; id: string; updates: Partial<InternalToast> }
  | { type: "DISMISS"; id?: string }
  | { type: "REMOVE"; id?: string }
  | { type: "UPSERT"; toast: InternalToast }
  | { type: "DISMISS_GROUP"; group: string }
  | { type: "REMOVE_GROUP"; group: string };

export interface ToasterContextValue {
  addToast: (
    message: string | ReactNode,
    options?: Omit<ToastOptions, "variant"> & {
      variant?: InternalVariant;
      isCustom?: boolean;
    },
  ) => string;
  updateToast: (id: string, updates: Partial<InternalToast>) => void;
  dismissToast: (id?: string) => void;
  removeToast: (id?: string) => void;
  dismissGroup: (group: string) => void;
  removeGroup: (group: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  history: () => ReadonlyArray<ToastHistoryEntry>;
  /** Per-provider store powering `useToast23Headless` and `Toast23DevTools`. */
  headlessStore: HeadlessStore;
  config: {
    maxVisible: number;
    position: ToastPosition;
    duration: number;
    layout: ToastLayout;
    dir: ToastDirection;
    theme: ToastTheme;
    swipeThreshold: number;
    swipeEnabled: boolean;
    sound: boolean;
    fallbackToNotification: boolean;
  };
  isPausedGlobally: boolean;
}
