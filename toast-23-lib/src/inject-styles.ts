/**
 * toast-23 — Automatic style injection.
 *
 * The CSS is bundled into the JS as a string (via Vite `?inline`) and inserted
 * into `<head>` the first time the provider or standalone API mounts. Users
 * never need to import `toast-23/styles.css` manually.
 *
 * SSR-safe: skips when `document` is unavailable.
 * Idempotent: a `data-toast23` marker prevents double-injection across
 * multiple providers, hot reloads, and remounts.
 */

import css from "./styles.css?inline";

const MARKER = "data-toast23-styles";

export function injectStyles(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector(`style[${MARKER}]`)) return;

  const style = document.createElement("style");
  style.setAttribute(MARKER, "");
  style.textContent = css;
  document.head.appendChild(style);
}
