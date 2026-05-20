/**
 * toast-23 — Public API
 *
 * CSS is auto-injected at runtime by `<Toast23Provider>` / `createToast23()`.
 * The source-level `import "./styles.css"` below is a build-time signal that
 * tells Vite to also emit `dist/toast-23.css` for users who prefer to opt
 * out of auto-injection. It has no runtime effect in the published bundles.
 */

import "./styles.css";

// Provider + components
export { Toast23Provider } from "./provider";
export { Toast23DevTools } from "./devtools";
export type { Toast23DevToolsProps } from "./devtools";

// Hooks
export { useToast } from "./use-toast";
export { useToast23Headless } from "./use-toast-headless";
export type { HeadlessApi } from "./use-toast-headless";

// Standalone / imperative API
export { createToast23 } from "./standalone";
export type { StandaloneOptions, StandaloneToastApi } from "./standalone";

// Types
export type {
  ToastVariant,
  ToastPosition,
  ToastDirection,
  ToastTheme,
  ToastLayout,
  ToastOptions,
  ToastAction,
  ToastApi,
  Toast23ProviderProps,
  PromiseOptions,
  ConfirmOptions,
  ToastHistoryEntry,
} from "./types";
