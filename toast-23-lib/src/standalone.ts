/**
 * toast-23 — Standalone / Imperative API
 *
 * Used when you need toast notifications outside of React (Angular, Vue,
 * Svelte, vanilla JS, etc.). It internally bootstraps a minimal React root.
 *
 * ```ts
 * import { createToast23 } from "toast-23";
 *
 * const toast = createToast23({ position: "top-right" });
 *
 * toast.success("Saved!");
 * toast.error("Something went wrong");
 * toast.dismiss(id);
 *
 * // Cleanup when done (e.g. on app destroy)
 * toast.destroy();
 * ```
 */

import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Toast23Provider } from "./provider";
import { useToast } from "./use-toast";
import type {
  ToastPosition,
  ToastOptions,
  PromiseOptions,
  ToastApi,
} from "./types";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StandaloneOptions {
  /** Where on screen toasts appear. @default "top-right" */
  position?: ToastPosition;
  /** Max simultaneous toasts. @default 5 */
  maxVisible?: number;
  /** Default auto-dismiss duration in ms. @default 5000 */
  duration?: number;
}

export interface StandaloneToastApi {
  /** Shows a default toast. Returns the toast id. */
  (message: string | ReactNode, options?: ToastOptions): string;
  /** Shows a success toast. */
  success: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Shows an error toast. */
  error: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Shows a warning toast. */
  warning: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Shows an info toast. */
  info: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Shows a loading toast. Returns the toast id for later update. */
  loading: (message: string, options?: Omit<ToastOptions, "variant">) => string;
  /** Shows a custom toast with JSX content and no default styles. */
  custom: (
    content: ReactNode,
    options?: Omit<ToastOptions, "variant">,
  ) => string;
  /** Track an async operation with loading → success / error transitions. */
  promise: <T>(
    promise: Promise<T> | (() => Promise<T>),
    options: PromiseOptions<T>,
    toastOptions?: ToastOptions,
  ) => Promise<T>;
  /** Manually dismisses a toast by id. Omits id to dismiss all. */
  dismiss: (id?: string) => void;
  /** Instantly removes a toast from DOM (no exit animation). Omits id to remove all. */
  remove: (id?: string) => void;
  /** Unmounts the React root and removes the container from the DOM. */
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Bridge component — captures the useToast API and passes it out
// ---------------------------------------------------------------------------

let _resolveApi: ((api: ToastApi) => void) | null = null;

function Bridge() {
  const api = useToast();

  // Resolves the promise on first render; update the ref on every render
  // so the external caller always has the latest stable API reference.
  React.useEffect(() => {
    if (_resolveApi) {
      _resolveApi(api);
      _resolveApi = null;
    }
  }, [api]);

  // Also stores on ref for synchronous access after first mount

  return null;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 *
 * Internally mounts a tiny React tree (provider + bridge) into a hidden
 * container. Returns a callable toast object with `.success()`, `.error()`, etc.
 *
 * Call `.destroy()` when your application unmounts to clean up.
 */
export function createToast23(
  options: StandaloneOptions = {},
): StandaloneToastApi {
  const { position = "top-right", maxVisible = 5, duration = 5000 } = options;

  // Creates a hidden container
  const container = document.createElement("div");
  container.setAttribute("data-toast23-standalone", "");
  container.style.display = "contents"; // invisible wrapper
  document.body.appendChild(container);

  //Waits for React to render before the API is available.
  // Use of promise + queue approach so calls before mount are buffered.
  let root: Root | null = createRoot(container);

  const apiReady = new Promise<ToastApi>((resolve) => {
    _resolveApi = resolve;
  });

  // Queue for calls made before React has mounted
  type QueuedCall = { method: string; args: unknown[] };
  const queue: QueuedCall[] = [];
  let resolvedApi: ToastApi | null = null;

  // Flushes queued calls once the API is ready
  apiReady.then((api) => {
    resolvedApi = api;
    for (const call of queue) {
      if (call.method === "__call__") {
        (api as any)(...call.args);
      } else {
        (api as any)[call.method](...call.args);
      }
    }
    queue.length = 0;
  });

  // Mounts React tree
  root.render(
    React.createElement(
      Toast23Provider,
      { position, maxVisible, duration } as any,
      React.createElement(Bridge),
    ),
  );

  // Builds the proxy API
  const proxyCall = (method: string, ...args: unknown[]): any => {
    if (resolvedApi) {
      return (resolvedApi as any)[method](...args);
    }
    queue.push({ method, args });
    return "queued";
  };

  const toast = ((message: string | ReactNode, opts?: ToastOptions) => {
    if (resolvedApi) return resolvedApi(message, opts);
    queue.push({ method: "__call__", args: [message, opts] });
    return "queued";
  }) as StandaloneToastApi;

  toast.success = (msg, opts) => proxyCall("success", msg, opts);
  toast.error = (msg, opts) => proxyCall("error", msg, opts);
  toast.warning = (msg, opts) => proxyCall("warning", msg, opts);
  toast.info = (msg, opts) => proxyCall("info", msg, opts);
  toast.loading = (msg, opts) => proxyCall("loading", msg, opts);
  toast.custom = (content, opts) => proxyCall("custom", content, opts);
  toast.dismiss = (id?) => proxyCall("dismiss", id);
  toast.remove = (id?) => proxyCall("remove", id);

  toast.promise = (promise, opts, toastOpts?) => {
    if (resolvedApi) return resolvedApi.promise(promise, opts, toastOpts);
    // For promises, it needs to wait for the API
    return apiReady.then((api) => api.promise(promise, opts, toastOpts));
  };

  toast.destroy = () => {
    if (root) {
      root.unmount();
      root = null;
    }
    container.remove();
    resolvedApi = null;
  };

  return toast;
}
