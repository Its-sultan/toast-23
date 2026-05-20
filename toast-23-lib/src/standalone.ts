/**
 * toast-23 — Standalone / Imperative API
 *
 * For use outside React (Angular, Vue, Svelte, vanilla JS). Internally mounts
 * a minimal React tree.
 *
 * Multiple `createToast23()` calls are safe and isolated — each instance gets
 * its own Bridge component and resolver.
 */

import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import { Toast23Provider } from "./provider";
import { useToast } from "./use-toast";
import { injectStyles } from "./inject-styles";
import { generateId } from "./utils";
import type {
  ConfirmOptions,
  PromiseOptions,
  ToastApi,
  ToastHistoryEntry,
  ToastLayout,
  ToastDirection,
  ToastPosition,
  ToastOptions,
} from "./types";
import type { ReactNode } from "react";

export interface StandaloneOptions {
  position?: ToastPosition;
  maxVisible?: number;
  duration?: number;
  layout?: ToastLayout;
  dir?: ToastDirection;
  historySize?: number;
  sound?: boolean;
  fallbackToNotification?: boolean;
  swipeEnabled?: boolean;
  swipeThreshold?: number;
}

export interface StandaloneToastApi {
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
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
  dismiss: (id?: string) => void;
  remove: (id?: string) => void;
  dismissGroup: (group: string) => void;
  removeGroup: (group: string) => void;
  pauseAll: () => void;
  resumeAll: () => void;
  history: () => ReadonlyArray<ToastHistoryEntry>;
  destroy: () => void;
}

/**
 * Per-instance Bridge — captures the React-side API via useToast() and writes
 * it back into a closure-scoped resolver. No module globals → safe to call
 * `createToast23()` multiple times.
 */
function makeBridge(setApi: (api: ToastApi) => void): React.FC {
  return function Bridge() {
    const api = useToast();
    React.useEffect(() => {
      setApi(api);
    }, [api]);
    return null;
  };
}

export function createToast23(
  options: StandaloneOptions = {},
): StandaloneToastApi {
  const {
    position = "top-right",
    maxVisible = 5,
    duration = 5000,
    layout = "default",
    dir = "ltr",
    historySize,
    sound,
    fallbackToNotification,
    swipeEnabled,
    swipeThreshold,
  } = options;

  injectStyles();

  const container = document.createElement("div");
  container.setAttribute("data-toast23-standalone", "");
  container.style.display = "contents";
  document.body.appendChild(container);

  let root: Root | null = createRoot(container);
  let resolvedApi: ToastApi | null = null;

  type QueuedCall = { method: string; args: unknown[] };
  const queue: QueuedCall[] = [];

  let readyResolve: (api: ToastApi) => void;
  const apiReady = new Promise<ToastApi>((resolve) => {
    readyResolve = resolve;
  });

  const setApi = (api: ToastApi) => {
    resolvedApi = api;
    readyResolve(api);
    while (queue.length > 0) {
      const call = queue.shift()!;
      try {
        if (call.method === "__call__") (api as any)(...call.args);
        else (api as any)[call.method](...call.args);
      } catch {
        /* swallow */
      }
    }
  };

  const Bridge = makeBridge(setApi);

  root.render(
    React.createElement(
      Toast23Provider,
      {
        position,
        maxVisible,
        duration,
        layout,
        dir,
        ...(historySize !== undefined && { historySize }),
        ...(sound !== undefined && { sound }),
        ...(fallbackToNotification !== undefined && { fallbackToNotification }),
        ...(swipeEnabled !== undefined && { swipeEnabled }),
        ...(swipeThreshold !== undefined && { swipeThreshold }),
      } as any,
      React.createElement(Bridge),
    ),
  );

  const proxyCall = (method: string, ...args: unknown[]): any => {
    if (resolvedApi) return (resolvedApi as any)[method](...args);
    queue.push({ method, args });
    return undefined;
  };

  // For the id-returning toast methods: when the React tree hasn't mounted yet,
  // pre-generate the id, queue the call with it pinned, and return it. The
  // flushed call carries the same id, so a follow-up `dismiss(id)` works even
  // for toasts fired before mount.
  const proxyToast = (
    method: string,
    content: string | ReactNode,
    opts?: ToastOptions,
  ): string => {
    if (resolvedApi) return (resolvedApi as any)[method](content, opts);
    const id = opts?.id ?? generateId();
    queue.push({ method, args: [content, { ...opts, id }] });
    return id;
  };

  const toast = ((message: string | ReactNode, opts?: ToastOptions) => {
    if (resolvedApi) return resolvedApi(message, opts);
    const id = opts?.id ?? generateId();
    queue.push({ method: "__call__", args: [message, { ...opts, id }] });
    return id;
  }) as StandaloneToastApi;

  toast.success = (msg, opts) => proxyToast("success", msg, opts);
  toast.error = (msg, opts) => proxyToast("error", msg, opts);
  toast.warning = (msg, opts) => proxyToast("warning", msg, opts);
  toast.info = (msg, opts) => proxyToast("info", msg, opts);
  toast.loading = (msg, opts) => proxyToast("loading", msg, opts);
  toast.custom = (content, opts) => proxyToast("custom", content, opts);
  toast.dismiss = (id?) => proxyCall("dismiss", id);
  toast.remove = (id?) => proxyCall("remove", id);
  toast.dismissGroup = (group) => proxyCall("dismissGroup", group);
  toast.removeGroup = (group) => proxyCall("removeGroup", group);
  toast.pauseAll = () => proxyCall("pauseAll");
  toast.resumeAll = () => proxyCall("resumeAll");
  toast.history = () => (resolvedApi ? resolvedApi.history() : []);

  toast.promise = (promise, opts, toastOpts?) => {
    if (resolvedApi) return resolvedApi.promise(promise, opts, toastOpts);
    return apiReady.then((api) => api.promise(promise, opts, toastOpts));
  };

  toast.confirm = (message, opts?) => {
    if (resolvedApi) return resolvedApi.confirm(message, opts);
    return apiReady.then((api) => api.confirm(message, opts));
  };

  toast.destroy = () => {
    queue.length = 0;
    if (root) {
      root.unmount();
      root = null;
    }
    container.remove();
    resolvedApi = null;
  };

  return toast;
}
