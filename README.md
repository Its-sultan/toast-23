<div align="center">
  <div style="position: relative; display:inline-block; max-width:100%;">
    <img src="./toast-23-lib/assets/toast-23-image.png" alt="toast-23 preview" style="width:100%; max-width:1900px; height:auto; border-radius:12px;" />
  </div>
  <br />
  <img src="./toast-23-lib/assets/toast-23-logo.png" alt="toast-23 logo" width="60" style="vertical-align: middle;" />
  <h2 style="font-weight: 900; margin-bottom:10px;">toast-23</h2>
  <p>A lightweight, accessible, fully-typed React toast notification library.</p>

  [![npm version](https://img.shields.io/npm/v/toast-23.svg)](https://www.npmjs.com/package/toast-23)
  [![bundle size](https://img.shields.io/bundlephobia/minzip/toast-23)](https://bundlephobia.com/package/toast-23)
  [![license](https://img.shields.io/npm/l/toast-23)](./LICENSE)

  [Website](https://toast-23.com/) · [Documentation](https://toast-23.com/docs)
</div>

---

## Overview

toast-23 is a zero-dependency toast notification library for React. It ships with CSS animations, dark mode, a promise tracking API, a queue system, and full TypeScript support all in a minimal footprint.

**v2 removes the manual CSS import.** Styles inject automatically on first mount. The subpath export `toast-23/styles.css` remains available for SSR, FOUC prevention, or build-time extraction.

---

## Installation

```bash
npm install toast-23
# or
yarn add toast-23
# or
pnpm add toast-23
# or
bun add toast-23
```

---

## Quick Start

### 1. Add the provider

```tsx
import { Toast23Provider } from "toast-23";

function App() {
  return (
    <Toast23Provider position="top-right" maxVisible={5} duration={4000}>
      <YourApp />
    </Toast23Provider>
  );
}
```

### 2. Call toasts from any component

```tsx
import { useToast } from "toast-23";

function MyComponent() {
  const toast = useToast();

  return (
    <div>
      <button onClick={() => toast("Hello world!")}>Default</button>
      <button onClick={() => toast.success("Saved successfully!")}>Success</button>
      <button onClick={() => toast.error("Something went wrong")}>Error</button>
      <button onClick={() => toast.warning("Please check your input")}>Warning</button>
      <button onClick={() => toast.info("New update available")}>Info</button>
    </div>
  );
}
```

---

## Features

### Core

| Feature | Description |
|---|---|
| Variants | `success`, `error`, `warning`, `info`, `default`, `loading` |
| Positions | 6 positions with per-toast override |
| Promise API | `toast.promise()` — loading → success / error with optional progress callbacks |
| Custom content | `toast.custom()` accepts any JSX |
| Deduplication | Toasts sharing an `id` update in place rather than stacking |
| Queue | Overflow collapses into a `+N more` badge, respecting `maxVisible` |

### v2 Additions

| Feature | Description |
|---|---|
| Zero-config styles | CSS auto-injects on provider mount no import required |
| Action buttons | `toast.success("Saved", { action: { label: "Undo", onClick } })` |
| Confirm toasts | `await toast.confirm("Delete?")` returns `Promise<boolean>` |
| Toast groups | `dismissGroup("id")` / `removeGroup("id")` |
| Global pause | `toast.pauseAll()` / `toast.resumeAll()` |
| History | `toast.history()` returns the last N dismissed toasts |
| Swipe-to-dismiss | Configurable threshold, fires on animation end |
| Stack layout | Sonner-style stacked view, expands on hover (`layout="stack"`) |
| Headless hook | `useToast23Headless()` for fully custom rendering |
| DevTools | `<Toast23DevTools />` inspect the live queue during development |
| Inline mode | Render toasts inside any container via the `target` prop |
| CSS variable theming | Every color, size, and timing token is overridable |
| RTL | Full right-to-left support via `dir="rtl"` |
| Keyboard shortcut | F8 (configurable) jumps focus to the toast region |
| Reduced motion | Respects `prefers-reduced-motion` |
| Sound cues | Optional per-variant audio feedback |
| OS notifications | Falls back to browser notifications when the tab is hidden |
| Dark mode | Automatic via `prefers-color-scheme`, or manual via `.dark` |
| Accessibility | ARIA live regions; error toasts use `assertive`, others use `polite` |
| Standalone API | `createToast23()` works outside React (Angular, Vue, Svelte, vanilla JS) |
| Tree-shakeable | Ships ESM + CJS |

---

## API Reference

Full documentation is available at [toast-23.com/docs](https://toast-23.com/docs).

---

## Testing

toast-23 uses [Vitest](https://vitest.dev/) with [Testing Library](https://testing-library.com/).

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```



---

## Feedback after Using

Full documentation is available at [toast-23.com/comments](https://toast-23.com/comments).

---
 

## CI/CD

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push:

- **Lint** — TypeScript type checking
- **Test** — Vitest suite against Node 18, 20, and 22
- **Build** — Vite library build with declaration file generation

---

## Local Development

```bash
npm install
npm run dev
```

Opens an interactive playground at `http://localhost:5173`. Every feature is wired to a live control dark mode, position switcher, stack layout, RTL, sounds, swipe-to-dismiss, headless view, inline mode, and DevTools.

---

## Changelog

### v2.0.1

- **Independent timers** — adding or dismissing a toast no longer resets the countdown or progress bar of other visible toasts. Each toast runs its own timer.
- **Isolated instances** — `useToast23Headless()` and `<Toast23DevTools />` now read from a per-provider store. Multiple `<Toast23Provider>` instances and `createToast23()` calls remain fully separated.
- **Bounded history** — the internal dismissed-ID set is pruned on removal, preventing unbounded growth in long-running apps. Reused IDs can re-enter history correctly.
- **Pre-mount IDs** — `createToast23()` calls made before the React tree mounts now return the real toast ID, so an early `dismiss(id)` works as expected.
- **Accessibility fix** — non-error toasts use `role="status"` (polite); error toasts remain `role="alert"` (assertive). The previous combination of `role="alert"` and `aria-live="polite"` was conflicting.
- **Swipe polish** — dismissal fires exactly when the off-screen fling animation completes, not before.

---

## Roadmap

- React Native port via the headless hook
- Persistent toasts that survive page navigation (localStorage)
- Rich-content recipes: avatars, multi-line layouts
- Additional locale support for default labels
- Theming presets for Material, Tailwind, and shadcn

---

## License

MIT © [Thabit S](https://github.com/Its-sultan)