/**
 * toast-23 — Public API
 *
 * Tree-shakeable entry point for the library.
 */

// Imports styles so Vite extracts them into the CSS bundle
import "./styles.css";

// Provider
export { Toast23Provider } from "./provider";

// Hook
export { useToast } from "./use-toast";

// Standalone / imperative API (for Angular, Vue, Svelte, vanilla JS, etc.)
export { createToast23 } from "./standalone";

// Types
export type {
  ToastVariant,
  ToastPosition,
  ToastOptions,
  ToastApi,
  Toast23ProviderProps,
  PromiseOptions,
} from "./types";

export type { StandaloneOptions, StandaloneToastApi } from "./standalone";
