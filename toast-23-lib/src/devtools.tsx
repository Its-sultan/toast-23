/**
 * toast-23 — DevTools overlay
 *
 * An optional inspector panel for the toast queue. Drop `<Toast23DevTools />`
 * inside the provider (or at the app root). Three states:
 *   - chip:     a small floating pill, just a count
 *   - compact:  ~360x480 panel with tabs (default expanded state)
 *   - expanded: enlarged panel for serious inspection
 *
 * Tabs:
 *   - Queue:    live active toasts, dismiss/remove/copy
 *   - History:  dismissed toasts, replay/copy
 *   - Settings: provider config readout, position/duration test overrides,
 *               spawn-test buttons, and a sound preview row
 */

"use client";

import * as React from "react";
import {
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { ToasterContext } from "./context";
import { createHeadlessStore } from "./headless-store";
import { playToastSound } from "./sound";
import type {
  InternalVariant,
  ToastHistoryEntry,
  ToastPosition,
} from "./types";

type DevToolsTab = "queue" | "history" | "settings";
type DevToolsSize = "compact" | "expanded";

export interface Toast23DevToolsProps {
  /** Screen corner to dock the panel. @default "bottom-left" */
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Start in the small chip state. @default true */
  collapsed?: boolean;
}

const ALL_VARIANTS: InternalVariant[] = [
  "default",
  "success",
  "info",
  "warning",
  "error",
  "loading",
];

const ALL_POSITIONS: ToastPosition[] = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const VARIANT_COLORS: Record<InternalVariant, string> = {
  success: "#16a34a",
  error: "#dc2626",
  warning: "#ca8a04",
  info: "#2563eb",
  loading: "#7c3aed",
  default: "#6b7280",
};

const SIZE = {
  compact: { width: 360, height: 480 },
  expanded: { width: 620, height: 720 },
} as const;

// Empty store used only when DevTools is rendered outside a provider — keeps
// the `useSyncExternalStore` hook order stable before the `!ctx` early return.
const EMPTY_STORE = createHeadlessStore();

export const Toast23DevTools: React.FC<Toast23DevToolsProps> = ({
  position = "bottom-left",
  collapsed: collapsedInitial = true,
}) => {
  const ctx = useContext(ToasterContext);
  const [collapsed, setCollapsed] = useState(collapsedInitial);
  const [size, setSize] = useState<DevToolsSize>("compact");
  const [tab, setTab] = useState<DevToolsTab>("queue");
  const [hidden, setHidden] = useState<Set<InternalVariant>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Settings tab — overrides applied to "spawn test" toasts only.
  const [testPosition, setTestPosition] = useState<ToastPosition | "">("");
  const [testDuration, setTestDuration] = useState<number>(4000);

  const store = ctx?.headlessStore ?? EMPTY_STORE;
  const toasts = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  const history = useMemo(
    () => (ctx ? ctx.history() : []),
    // `toasts` is in the deps so this memo invalidates whenever the queue
    // mutates — which is also when `ctx.history()` gains/loses entries.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, toasts],
  );

  const toggleVariant = useCallback((v: InternalVariant) => {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  }, []);

  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 1200);
  }, []);

  const copyJson = useCallback(
    (payload: Record<string, unknown>, key: string) => {
      const json = JSON.stringify(payload, null, 2);
      try {
        if (navigator?.clipboard?.writeText) {
          navigator.clipboard.writeText(json).then(
            () => flashCopied(key),
            () => flashCopied(key),
          );
        } else {
          flashCopied(key);
        }
      } catch {
        flashCopied(key);
      }
    },
    [flashCopied],
  );

  if (!ctx) return null;

  const visibleQueue = toasts.filter((t) => !hidden.has(t.variant));
  const visibleHistory = history.filter((h) => !hidden.has(h.variant));

  const queueCount = toasts.length;

  // ---- Replay & test-spawn handlers -----------------------------------------

  const replay = (h: ToastHistoryEntry) => {
    ctx.addToast(h.message, {
      variant: h.variant,
      title: h.title,
      group: h.group,
    });
  };

  const spawnTest = (variant: InternalVariant) => {
    ctx.addToast(`Test ${variant} toast`, {
      variant,
      title: variant === "default" ? undefined : variant.toUpperCase(),
      duration: testDuration,
      position: testPosition || undefined,
    });
  };

  // ---- Styles ---------------------------------------------------------------

  const dims = SIZE[size];
  const isTop = position.startsWith("top");
  const isRight = position.endsWith("right");

  const styles: Record<string, React.CSSProperties> = {
    chip: {
      position: "fixed",
      [isTop ? "top" : "bottom"]: 16,
      [isRight ? "right" : "left"]: 16,
      zIndex: 100000,
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 12px",
      background: "rgba(17, 24, 39, 0.96)",
      color: "#f9fafb",
      borderRadius: 999,
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 11,
      lineHeight: 1,
      boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
      border: "1px solid rgba(255,255,255,0.08)",
      cursor: "pointer",
      userSelect: "none",
    },
    panel: {
      position: "fixed",
      [isTop ? "top" : "bottom"]: 16,
      [isRight ? "right" : "left"]: 16,
      zIndex: 100000,
      width: `min(${dims.width}px, calc(100vw - 32px))`,
      height: `min(${dims.height}px, calc(100vh - 32px))`,
      background: "rgba(17, 24, 39, 0.97)",
      color: "#f9fafb",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      fontSize: 11,
      lineHeight: 1.5,
      borderRadius: 10,
      boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
      padding: "8px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
    },
    title: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontWeight: 700,
      letterSpacing: 0.3,
    },
    badge: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: 18,
      height: 18,
      padding: "0 5px",
      borderRadius: 999,
      background: "#3b82f6",
      color: "#fff",
      fontSize: 10,
      fontWeight: 700,
    },
    iconBtn: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 22,
      height: 22,
      padding: 0,
      borderRadius: 4,
      background: "transparent",
      color: "#cbd5e1",
      border: "1px solid rgba(255,255,255,0.12)",
      cursor: "pointer",
      fontSize: 12,
      fontFamily: "inherit",
    },
    tabs: {
      display: "flex",
      gap: 4,
      padding: "8px 10px 0",
    },
    tab: {
      flex: 1,
      padding: "5px 8px",
      borderRadius: 6,
      background: "transparent",
      color: "#9ca3af",
      border: "1px solid transparent",
      cursor: "pointer",
      fontSize: 10,
      fontFamily: "inherit",
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    tabActive: {
      background: "rgba(59, 130, 246, 0.15)",
      color: "#bfdbfe",
      borderColor: "rgba(59, 130, 246, 0.4)",
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      padding: "8px 10px",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
    },
    filterChip: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "2px 7px",
      borderRadius: 999,
      border: "1px solid rgba(255,255,255,0.12)",
      background: "rgba(255,255,255,0.04)",
      color: "#e5e7eb",
      fontSize: 9,
      fontWeight: 600,
      textTransform: "uppercase",
      letterSpacing: 0.4,
      cursor: "pointer",
      fontFamily: "inherit",
    },
    filterChipOff: {
      opacity: 0.35,
      textDecoration: "line-through",
    },
    body: {
      flex: 1,
      overflow: "auto",
    },
    empty: {
      padding: "20px 12px",
      color: "#6b7280",
      textAlign: "center",
    },
    row: {
      padding: "8px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    },
    rowTop: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 8,
      marginBottom: 4,
    },
    variantTag: {
      fontSize: 9,
      padding: "1px 6px",
      borderRadius: 3,
      color: "#fff",
      textTransform: "uppercase",
      letterSpacing: 0.3,
      fontWeight: 700,
    },
    rowMeta: {
      color: "#9ca3af",
      fontSize: 10,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    },
    rowMessage: {
      color: "#e5e7eb",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    rowActions: {
      display: "flex",
      gap: 4,
      marginTop: 6,
    },
    smallBtn: {
      flex: 1,
      padding: "3px 7px",
      borderRadius: 4,
      background: "rgba(255,255,255,0.06)",
      color: "#f9fafb",
      border: "1px solid rgba(255,255,255,0.1)",
      cursor: "pointer",
      fontSize: 10,
      fontFamily: "inherit",
    },
    smallBtnActive: {
      background: "rgba(34, 197, 94, 0.18)",
      borderColor: "rgba(34, 197, 94, 0.5)",
      color: "#bbf7d0",
    },
    footer: {
      display: "flex",
      gap: 4,
      padding: "8px 10px",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.2)",
    },
    section: {
      padding: "10px 12px",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
    },
    sectionTitle: {
      fontSize: 9,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: 0.6,
      color: "#9ca3af",
      marginBottom: 8,
    },
    grid3: {
      display: "grid",
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: 4,
    },
    grid6: {
      display: "grid",
      gridTemplateColumns: "repeat(6, 1fr)",
      gap: 4,
    },
    kvRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "3px 0",
      color: "#cbd5e1",
      fontSize: 10,
    },
    kvKey: { color: "#9ca3af" },
    inputRow: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginBottom: 8,
    },
    input: {
      flex: 1,
      padding: "3px 6px",
      borderRadius: 4,
      background: "rgba(255,255,255,0.06)",
      color: "#f9fafb",
      border: "1px solid rgba(255,255,255,0.1)",
      fontSize: 10,
      fontFamily: "inherit",
    },
  };

  const variantStyle = (v: InternalVariant): React.CSSProperties => ({
    ...styles.variantTag,
    background: VARIANT_COLORS[v],
  });

  const Chip = (
    <button
      type="button"
      style={styles.chip}
      onClick={() => setCollapsed(false)}
      data-toast23-devtools="chip"
      aria-label={`Open toast-23 devtools (${queueCount} active)`}
    >
      <span style={{ fontWeight: 700, letterSpacing: 0.3 }}>
        toast-23 devtools
      </span>
      <span style={styles.badge}>{queueCount}</span>
      {ctx.isPausedGlobally && (
        <span style={{ ...styles.badge, background: "#dc2626" }}>paused</span>
      )}
    </button>
  );

  if (collapsed) return Chip;

  // ---- Tab bodies -----------------------------------------------------------

  const filterChips = (
    <div style={styles.chipRow}>
      {ALL_VARIANTS.map((v) => {
        const off = hidden.has(v);
        return (
          <button
            key={v}
            type="button"
            onClick={() => toggleVariant(v)}
            style={{
              ...styles.filterChip,
              ...(off ? styles.filterChipOff : null),
              borderColor: off
                ? "rgba(255,255,255,0.12)"
                : VARIANT_COLORS[v] + "80",
            }}
            aria-pressed={!off}
            title={off ? `Show ${v}` : `Hide ${v}`}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: VARIANT_COLORS[v],
                display: "inline-block",
              }}
            />
            {v}
          </button>
        );
      })}
    </div>
  );

  const QueueTab = (
    <>
      {filterChips}
      <div style={styles.body}>
        {visibleQueue.length === 0 && (
          <div style={styles.empty}>
            {toasts.length === 0
              ? "Queue is empty."
              : "All variants filtered out."}
          </div>
        )}
        {visibleQueue.map((t) => {
          const copyKey = `q-${t.id}`;
          return (
            <div key={t.id} style={styles.row}>
              <div style={styles.rowTop}>
                <span style={variantStyle(t.variant)}>{t.variant}</span>
                <span style={styles.rowMeta} title={t.id}>
                  {t.id}
                </span>
              </div>
              <div style={styles.rowMessage}>
                {typeof t.message === "string"
                  ? t.message
                  : "[ReactNode message]"}
              </div>
              <div style={{ ...styles.rowMeta, marginTop: 2 }}>
                {t.duration}ms · {t.position}
                {t.group && ` · group: ${t.group}`}
                {t.isExiting && " · exiting"}
              </div>
              <div style={styles.rowActions}>
                <button
                  type="button"
                  style={styles.smallBtn}
                  onClick={() => ctx.dismissToast(t.id)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  style={styles.smallBtn}
                  onClick={() => ctx.removeToast(t.id)}
                >
                  Remove
                </button>
                <button
                  type="button"
                  style={
                    copiedKey === copyKey
                      ? { ...styles.smallBtn, ...styles.smallBtnActive }
                      : styles.smallBtn
                  }
                  onClick={() =>
                    copyJson(
                      {
                        id: t.id,
                        variant: t.variant,
                        message:
                          typeof t.message === "string"
                            ? t.message
                            : "[ReactNode]",
                        title: t.title,
                        duration: t.duration,
                        position: t.position,
                        group: t.group,
                        createdAt: t.createdAt,
                      },
                      copyKey,
                    )
                  }
                >
                  {copiedKey === copyKey ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={styles.footer}>
        <button
          type="button"
          style={styles.smallBtn}
          onClick={() =>
            ctx.isPausedGlobally ? ctx.resumeAll() : ctx.pauseAll()
          }
        >
          {ctx.isPausedGlobally ? "Resume all" : "Pause all"}
        </button>
        <button
          type="button"
          style={styles.smallBtn}
          onClick={() => ctx.dismissToast()}
        >
          Dismiss all
        </button>
        <button
          type="button"
          style={styles.smallBtn}
          onClick={() => ctx.removeToast()}
        >
          Clear
        </button>
      </div>
    </>
  );

  const HistoryTab = (
    <>
      {filterChips}
      <div style={styles.body}>
        {visibleHistory.length === 0 && (
          <div style={styles.empty}>
            {history.length === 0
              ? "No dismissed toasts yet. Fire a toast and dismiss it."
              : "All variants filtered out."}
          </div>
        )}
        {visibleHistory.map((h) => {
          const copyKey = `h-${h.id}`;
          const ago = formatAgo(Date.now() - h.dismissedAt);
          return (
            <div key={h.id} style={styles.row}>
              <div style={styles.rowTop}>
                <span style={variantStyle(h.variant)}>{h.variant}</span>
                <span style={styles.rowMeta} title={new Date(h.dismissedAt).toISOString()}>
                  {ago}
                </span>
              </div>
              {h.title && (
                <div
                  style={{ fontWeight: 700, color: "#f9fafb", marginBottom: 2 }}
                >
                  {h.title}
                </div>
              )}
              <div style={styles.rowMessage}>
                {typeof h.message === "string"
                  ? h.message
                  : "[ReactNode message]"}
              </div>
              {h.group && (
                <div style={{ ...styles.rowMeta, marginTop: 2 }}>
                  group: {h.group}
                </div>
              )}
              <div style={styles.rowActions}>
                <button
                  type="button"
                  style={styles.smallBtn}
                  onClick={() => replay(h)}
                  title="Re-fire this toast"
                >
                  Replay
                </button>
                <button
                  type="button"
                  style={
                    copiedKey === copyKey
                      ? { ...styles.smallBtn, ...styles.smallBtnActive }
                      : styles.smallBtn
                  }
                  onClick={() =>
                    copyJson(
                      {
                        id: h.id,
                        variant: h.variant,
                        message:
                          typeof h.message === "string"
                            ? h.message
                            : "[ReactNode]",
                        title: h.title,
                        group: h.group,
                        dismissedAt: h.dismissedAt,
                      },
                      copyKey,
                    )
                  }
                >
                  {copiedKey === copyKey ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={styles.footer}>
        <span style={{ ...styles.rowMeta, alignSelf: "center", flex: 1 }}>
          {history.length} entries · cap {history.length >= 50 ? "reached" : "ok"}
        </span>
      </div>
    </>
  );

  const SettingsTab = (
    <div style={styles.body}>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Spawn test toast</div>
        <div style={styles.grid6}>
          {ALL_VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              style={{
                ...styles.smallBtn,
                background: VARIANT_COLORS[v] + "33",
                borderColor: VARIANT_COLORS[v] + "80",
                color: "#fff",
              }}
              onClick={() => spawnTest(v)}
              title={`Fire a ${v} toast`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Sound preview</div>
        <div style={styles.grid6}>
          {ALL_VARIANTS.map((v) => (
            <button
              key={v}
              type="button"
              style={styles.smallBtn}
              onClick={() => playToastSound(v)}
              title={`Play ${v} tone`}
            >
              ♪ {v.slice(0, 4)}
            </button>
          ))}
        </div>
        <div style={{ ...styles.rowMeta, marginTop: 6 }}>
          Plays the tone patch directly. Requires a prior user gesture (browser
          autoplay policy).
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionTitle}>Test overrides</div>
        <div style={styles.inputRow}>
          <span style={styles.kvKey}>duration</span>
          <input
            type="number"
            min={0}
            step={500}
            value={testDuration}
            onChange={(e) => setTestDuration(Number(e.target.value) || 0)}
            style={styles.input}
          />
          <span style={styles.kvKey}>ms</span>
        </div>
        <div style={{ ...styles.kvKey, marginBottom: 4, fontSize: 10 }}>
          position
        </div>
        <div style={styles.grid3}>
          <button
            type="button"
            style={
              testPosition === ""
                ? { ...styles.smallBtn, ...styles.smallBtnActive }
                : styles.smallBtn
            }
            onClick={() => setTestPosition("")}
          >
            inherit
          </button>
          {ALL_POSITIONS.map((p) => (
            <button
              key={p}
              type="button"
              style={
                testPosition === p
                  ? { ...styles.smallBtn, ...styles.smallBtnActive }
                  : styles.smallBtn
              }
              onClick={() => setTestPosition(p)}
              title={p}
            >
              {p.replace("top-", "↑").replace("bottom-", "↓")}
            </button>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <div
          style={{
            ...styles.sectionTitle,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>Provider config</span>
          <button
            type="button"
            style={
              copiedKey === "config"
                ? {
                    ...styles.smallBtn,
                    ...styles.smallBtnActive,
                    flex: "0 0 auto",
                    padding: "2px 8px",
                  }
                : { ...styles.smallBtn, flex: "0 0 auto", padding: "2px 8px" }
            }
            onClick={() => copyJson({ ...ctx.config }, "config")}
          >
            {copiedKey === "config" ? "Copied" : "Copy JSON"}
          </button>
        </div>
        {Object.entries(ctx.config).map(([k, v]) => (
          <div key={k} style={styles.kvRow}>
            <span style={styles.kvKey}>{k}</span>
            <span>{String(v)}</span>
          </div>
        ))}
        <div style={{ ...styles.kvRow, marginTop: 6 }}>
          <span style={styles.kvKey}>paused</span>
          <span>{ctx.isPausedGlobally ? "yes" : "no"}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.panel} data-toast23-devtools="panel">
      <div style={styles.header}>
        <span style={styles.title}>
          toast-23
          <span style={styles.badge}>{queueCount}</span>
          {ctx.isPausedGlobally && (
            <span style={{ ...styles.badge, background: "#dc2626" }}>
              paused
            </span>
          )}
        </span>
        <span style={{ display: "inline-flex", gap: 4 }}>
          <button
            type="button"
            style={styles.iconBtn}
            onClick={() =>
              setSize((s) => (s === "compact" ? "expanded" : "compact"))
            }
            title={size === "compact" ? "Expand" : "Shrink"}
            aria-label={size === "compact" ? "Expand panel" : "Shrink panel"}
          >
            {size === "compact" ? "⤢" : "⤡"}
          </button>
          <button
            type="button"
            style={styles.iconBtn}
            onClick={() => setCollapsed(true)}
            title="Collapse to chip"
            aria-label="Collapse to chip"
          >
            –
          </button>
        </span>
      </div>

      <div style={styles.tabs}>
        {(["queue", "history", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            style={
              tab === t ? { ...styles.tab, ...styles.tabActive } : styles.tab
            }
            onClick={() => setTab(t)}
          >
            {t}
            {t === "queue" && queueCount > 0 ? ` (${queueCount})` : ""}
            {t === "history" && history.length > 0
              ? ` (${history.length})`
              : ""}
          </button>
        ))}
      </div>

      {tab === "queue" && QueueTab}
      {tab === "history" && HistoryTab}
      {tab === "settings" && SettingsTab}
    </div>
  );
};

Toast23DevTools.displayName = "Toast23DevTools";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatAgo(ms: number): string {
  if (ms < 0) return "now";
  const s = Math.floor(ms / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
