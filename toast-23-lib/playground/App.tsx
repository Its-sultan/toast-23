/**
 * toast-23 — Playground
 *
 * Run via `npm run dev` and open http://localhost:5173.
 * Every public feature has at least one button.
 */

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Toast23Provider,
  Toast23DevTools,
  useToast,
  useToast23Headless,
  type ToastPosition,
  type ToastLayout,
  type ToastDirection,
} from "../src";
import logoUrl from "../assets/toast-23-logo.png";

// Indigo — accent for focus rings, switches, and the page glow.
const BRAND = "rgb(99, 102, 241)";

const ThemeCtx = createContext(false);
const useDark = () => useContext(ThemeCtx);

export function Playground() {
  const [position, setPosition] = useState<ToastPosition>("top-right");
  const [layout, setLayout] = useState<ToastLayout>("default");
  const [dir, setDir] = useState<ToastDirection>("ltr");
  const [dark, setDark] = useState(false);
  const [sound, setSound] = useState(false);
  const [showDevtools, setShowDevtools] = useState(true);
  const [maxVisible, setMaxVisible] = useState(5);

  // Brand glow behind the page. Bolder in dark mode where it carries the
  // surface; subtle in light mode so cards still read clearly.
  const glow = dark
    ? `
      radial-gradient(900px circle at 15% -10%, rgba(99, 102, 241, 0.35), transparent 55%),
      radial-gradient(700px circle at 90% 110%, rgba(168, 85, 247, 0.22), transparent 55%),
      #0b1120
    `
    : `
      radial-gradient(900px circle at 15% -10%, rgba(99, 102, 241, 0.18), transparent 55%),
      radial-gradient(700px circle at 90% 110%, rgba(236, 72, 153, 0.10), transparent 55%),
      #f8fafc
    `;

  return (
    <ThemeCtx.Provider value={dark}>
    <PlaygroundStyles />
    <div
      className={dark ? "dark" : ""}
      style={{
        minHeight: "100vh",
        background: glow,
        backgroundAttachment: "fixed",
        color: dark ? "#f9fafb" : "#0f172a",
        colorScheme: dark ? "dark" : "light",
      }}
    >
      <Toast23Provider
        position={position}
        layout={layout}
        dir={dir}
        theme={dark ? "dark" : "light"}
        maxVisible={maxVisible}
        sound={sound}
        duration={4000}
      >
        <div
          style={{
            minHeight: "100vh",
            padding: "24px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 24,
            maxWidth: 980,
            margin: "0 auto",
          }}
        >
          <header style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <img
              src={logoUrl}
              alt="toast-23 logo"
              width={44}
              height={44}
              style={{ borderRadius: 10, flexShrink: 0 }}
            />
            <div>
              <h1 style={{ margin: 0, fontSize: 28 }}>toast-23 playground</h1>
              <p style={{ color: dark ? "#cbd5e1" : "#475569", margin: "4px 0 0" }}>
                Click anything. Every feature has a button below.
              </p>
            </div>
          </header>

          <ConfigPanel
            position={position}
            setPosition={setPosition}
            layout={layout}
            setLayout={setLayout}
            dir={dir}
            setDir={setDir}
            dark={dark}
            setDark={setDark}
            sound={sound}
            setSound={setSound}
            maxVisible={maxVisible}
            setMaxVisible={setMaxVisible}
            showDevtools={showDevtools}
            setShowDevtools={setShowDevtools}
          />

          <Demos />
          <InlineDemo theme={dark ? "dark" : "light"} />
          <HeadlessDemo />
        </div>

        {showDevtools && <Toast23DevTools position="bottom-right" collapsed={false} />}
      </Toast23Provider>
    </div>
    </ThemeCtx.Provider>
  );
}

/** Scoped CSS for things inline styles can't express: :focus, :hover, and
 *  hiding the native number-input spinner. */
function PlaygroundStyles() {
  return (
    <style>{`
      .pg-num-input::-webkit-outer-spin-button,
      .pg-num-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }
      .pg-num-input { -moz-appearance: textfield; appearance: textfield; }

      .pg-num-btn:hover { background: rgba(99, 102, 241, 0.18); }
      .pg-num-btn:active { background: rgba(99, 102, 241, 0.3); }
      .pg-num-btn:focus-visible,
      .pg-num-input:focus-visible,
      .pg-select-trigger:focus-visible {
        outline: 2px solid ${BRAND};
        outline-offset: 1px;
      }

      .pg-switch:focus-visible {
        outline: 2px solid ${BRAND};
        outline-offset: 2px;
      }
    `}</style>
  );
}

// ---------------------------------------------------------------------------

function ConfigPanel(props: {
  position: ToastPosition;
  setPosition: (p: ToastPosition) => void;
  layout: ToastLayout;
  setLayout: (l: ToastLayout) => void;
  dir: ToastDirection;
  setDir: (d: ToastDirection) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  sound: boolean;
  setSound: (v: boolean) => void;
  maxVisible: number;
  setMaxVisible: (n: number) => void;
  showDevtools: boolean;
  setShowDevtools: (v: boolean) => void;
}) {
  const POSITIONS: ToastPosition[] = [
    "top-right",
    "top-left",
    "top-center",
    "bottom-right",
    "bottom-left",
    "bottom-center",
  ];

  return (
    <Card title="Provider configuration">
      <Row label="Position">
        <Select
          value={props.position}
          onChange={props.setPosition}
          options={POSITIONS.map((p) => ({ value: p, label: p }))}
        />
      </Row>
      <Row label="Layout">
        <Select
          value={props.layout}
          onChange={props.setLayout}
          options={[
            { value: "default", label: "default" },
            { value: "stack", label: "stack (hover to expand)" },
          ]}
        />
      </Row>
      <Row label="Direction">
        <Select
          value={props.dir}
          onChange={props.setDir}
          options={[
            { value: "ltr", label: "ltr" },
            { value: "rtl", label: "rtl" },
          ]}
        />
      </Row>
      <Row label="Max visible">
        <NumberInput
          value={props.maxVisible}
          min={1}
          max={10}
          onChange={props.setMaxVisible}
        />
      </Row>
      <Row label="Dark mode">
        <Toggle value={props.dark} onChange={props.setDark} />
      </Row>
      <Row label="Sounds">
        <Toggle value={props.sound} onChange={props.setSound} />
      </Row>
      <Row label="DevTools panel">
        <Toggle value={props.showDevtools} onChange={props.setShowDevtools} />
      </Row>
    </Card>
  );
}

function Demos() {
  const toast = useToast();

  return (
    <Card title="Variants & core features">
      <ButtonGrid>
        <Button onClick={() => toast("Hello world!")}>default</Button>
        <Button onClick={() => toast.success("Saved successfully!")}>success</Button>
        <Button onClick={() => toast.error("Something went wrong")}>error</Button>
        <Button onClick={() => toast.warning("Heads up!")}>warning</Button>
        <Button onClick={() => toast.info("New version available")}>info</Button>
        <Button onClick={() => toast.loading("Working…")}>loading</Button>
        <Button
          onClick={() =>
            toast("With title", { title: "Important", duration: 6000 })
          }
        >
          with title
        </Button>
        <Button
          onClick={() =>
            toast.success("Action time", {
              action: {
                label: "Undo",
                onClick: () => toast.info("Undone!"),
              },
            })
          }
        >
          action button (Undo)
        </Button>
        <Button
          onClick={async () => {
            const ok = await toast.confirm("Delete this file?", {
              confirmLabel: "Delete",
              cancelLabel: "Keep",
            });
            toast.info(ok ? "Deleted." : "Kept.");
          }}
        >
          confirm
        </Button>
        <Button
          onClick={() =>
            toast.promise(fakeFetch(2000, "ok"), {
              loading: "Fetching…",
              success: "Done!",
              error: "Failed",
            })
          }
        >
          promise
        </Button>
        <Button
          onClick={() =>
            toast.promise(fakeFetch(3000, "ok"), {
              loading: "Uploading…",
              success: "Upload complete!",
              error: "Upload failed",
              progress: (report) => {
                let p = 0;
                const id = setInterval(() => {
                  p += 0.1;
                  report(Math.min(1, p));
                  if (p >= 1) clearInterval(id);
                }, 250);
              },
            })
          }
        >
          promise w/ progress
        </Button>
        <Button
          onClick={() => {
            toast.success("Saved 1", { group: "saves" });
            toast.success("Saved 2", { group: "saves" });
            toast.success("Saved 3", { group: "saves" });
          }}
        >
          group: add 3
        </Button>
        <Button onClick={() => toast.dismissGroup("saves")}>
          group: dismiss
        </Button>
        <Button onClick={() => toast.pauseAll()}>pauseAll</Button>
        <Button onClick={() => toast.resumeAll()}>resumeAll</Button>
        <Button
          onClick={() =>
            toast("With sound!", { sound: true, variant: "success" })
          }
        >
          one-off sound
        </Button>
        <Button
          onClick={() =>
            toast.info("This will fall back to a system notification while the tab is hidden.", {
              fallbackToNotification: true,
              duration: 10000,
            })
          }
        >
          notification fallback
        </Button>
        <Button
          onClick={() => {
            const items = toast.history();
            toast.custom(
              <div>
                <strong>History ({items.length})</strong>
                <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                  {items.slice(0, 5).map((h) => (
                    <li key={h.id}>
                      [{h.variant}] {typeof h.message === "string" ? h.message : "…"}
                    </li>
                  ))}
                </ul>
              </div>,
              { duration: 8000 },
            );
          }}
        >
          show history
        </Button>
        <Button onClick={() => toast.dismiss()}>dismiss all</Button>
      </ButtonGrid>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Inline-mode demo — uses a sub-provider that mounts toasts inside a card.
// ---------------------------------------------------------------------------

function InlineDemo({ theme }: { theme: "light" | "dark" }) {
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  return (
    <Card title="Inline mode (toasts inside a container, not fixed)">
      <div
        ref={setTarget}
        style={{
          position: "relative",
          height: 180,
          border: "2px dashed #cbd5e1",
          borderRadius: 12,
          overflow: "hidden",
          background: "rgba(148, 163, 184, 0.05)",
        }}
      />
      {target && (
        <Toast23Provider
          target={target}
          position="top-right"
          duration={3000}
          theme={theme}
        >
          <InlineTriggers />
        </Toast23Provider>
      )}
    </Card>
  );
}

function InlineTriggers() {
  const toast = useToast();
  return (
    <ButtonGrid>
      <Button onClick={() => toast.success("Inside the card!")}>inline success</Button>
      <Button onClick={() => toast.error("Also inside!")}>inline error</Button>
    </ButtonGrid>
  );
}

// ---------------------------------------------------------------------------
// Headless demo
// ---------------------------------------------------------------------------

function HeadlessDemo() {
  return (
    <Card title="Headless mode (renders the queue using its own UI)">
      <HeadlessView />
    </Card>
  );
}

function HeadlessView() {
  const { toasts, dismiss, isPausedGlobally } = useToast23Headless();

  return (
    <div>
      <p style={{ marginBottom: 8 }}>
        Live queue ({toasts.length}){isPausedGlobally ? " · paused" : ""}
      </p>
      {toasts.length === 0 && (
        <div style={{ color: "#94a3b8", fontStyle: "italic" }}>
          Empty — fire a toast from above to see it appear here.
        </div>
      )}
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {toasts.map((t) => (
          <li
            key={t.id}
            style={{
              padding: "8px 12px",
              borderRadius: 6,
              background: "rgba(148, 163, 184, 0.12)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>
              <strong>[{t.variant}]</strong>{" "}
              {typeof t.message === "string" ? t.message : "(node)"}
            </span>
            <button type="button" onClick={() => dismiss(t.id)}>
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tiny UI primitives
// ---------------------------------------------------------------------------

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: "rgba(148, 163, 184, 0.08)",
        border: "1px solid rgba(148, 163, 184, 0.2)",
        borderRadius: 12,
        padding: 16,
      }}
    >
      <h2 style={{ marginTop: 0, marginBottom: 12, fontSize: 16 }}>
        {props.title}
      </h2>
      {props.children}
    </section>
  );
}

function Row(props: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "4px 0",
      }}
    >
      <label style={{ minWidth: 130 }}>{props.label}</label>
      {props.children}
    </div>
  );
}

function ButtonGrid(props: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 8,
      }}
    >
      {props.children}
    </div>
  );
}

function Button(props: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        background: "rgba(99, 102, 241, 0.15)",
        border: "1px solid rgba(99, 102, 241, 0.4)",
        color: "inherit",
        cursor: "pointer",
        fontSize: 13,
        fontFamily: "inherit",
      }}
    >
      {props.children}
    </button>
  );
}

/** Themed toggle switch. Native checkboxes don't pick up our colors. */
function Toggle(props: { value: boolean; onChange: (v: boolean) => void }) {
  const dark = useDark();
  const trackOff = dark ? "rgba(148, 163, 184, 0.25)" : "rgba(148, 163, 184, 0.4)";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.value}
      onClick={() => props.onChange(!props.value)}
      className="pg-switch"
      style={{
        position: "relative",
        width: 38,
        height: 22,
        padding: 0,
        border: "none",
        borderRadius: 999,
        cursor: "pointer",
        background: props.value ? BRAND : trackOff,
        transition: "background 150ms ease",
        boxShadow: props.value
          ? "0 0 0 1px rgba(99, 102, 241, 0.4), 0 0 12px rgba(99, 102, 241, 0.35)"
          : "inset 0 0 0 1px rgba(148, 163, 184, 0.3)",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          left: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          transform: props.value ? "translateX(16px)" : "translateX(0)",
          transition: "transform 150ms ease",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
        }}
      />
    </button>
  );
}

/** Number input without the native spinner arrows. Holds a local string
 *  so the field can be cleared mid-edit without the controlled value
 *  snapping back. Empty/invalid input reverts on blur. */
function NumberInput(props: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const dark = useDark();
  const { min, max } = props;
  const clamp = (n: number) => {
    if (typeof min === "number") n = Math.max(min, n);
    if (typeof max === "number") n = Math.min(max, n);
    return n;
  };

  const [text, setText] = useState(String(props.value));

  // Sync from parent only when the value actually diverges, so in-progress
  // typing isn't clobbered.
  useEffect(() => {
    if (Number(text) !== props.value) {
      setText(String(props.value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      className="pg-num-input"
      value={text}
      min={min}
      max={max}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === "" || raw === "-") return; // mid-typing
        const n = Number(raw);
        if (Number.isFinite(n)) props.onChange(clamp(n));
      }}
      onBlur={() => {
        const n = Number(text);
        if (text === "" || !Number.isFinite(n)) {
          setText(String(props.value));
          return;
        }
        const clamped = clamp(n);
        if (clamped !== n) setText(String(clamped));
        if (clamped !== props.value) props.onChange(clamped);
      }}
      style={{
        width: 70,
        height: 30,
        padding: "0 10px",
        background: dark ? "rgba(15, 23, 42, 0.5)" : "rgba(255, 255, 255, 0.9)",
        color: "inherit",
        border: "1px solid rgba(148, 163, 184, 0.3)",
        borderRadius: 6,
        textAlign: "center",
        fontSize: 13,
        fontFamily: "inherit",
      }}
    />
  );
}

/** Themed select. Native <select> can't be styled to match dark mode, and
 *  the generic lets `onChange` stay typed against the option enum. */
function Select<T extends string>(props: {
  value: T;
  onChange: (v: T) => void;
  options: readonly { value: T; label: string }[];
}) {
  const dark = useDark();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = props.options.find((o) => o.value === props.value);

  // Popup surfaces matched to each theme.
  const popupBg = dark ? "rgba(15, 23, 42, 0.97)" : "rgba(255, 255, 255, 0.98)";
  const popupBorder = dark
    ? "rgba(148, 163, 184, 0.3)"
    : "rgba(148, 163, 184, 0.4)";
  const popupShadow = dark
    ? "0 10px 30px rgba(0, 0, 0, 0.45)"
    : "0 10px 30px rgba(15, 23, 42, 0.12)";
  const triggerBg = dark
    ? "rgba(148, 163, 184, 0.12)"
    : "rgba(255, 255, 255, 0.9)";

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="pg-select-trigger"
        style={{
          appearance: "none",
          padding: "6px 28px 6px 10px",
          background: triggerBg,
          color: "inherit",
          border: "1px solid " + popupBorder,
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 13,
          fontFamily: "inherit",
          minWidth: 160,
          textAlign: "left",
          position: "relative",
        }}
      >
        {current?.label ?? props.value}
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            opacity: 0.6,
            fontSize: 10,
          }}
        >
          ▾
        </span>
      </button>
      {open && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            margin: 0,
            padding: 4,
            background: popupBg,
            border: "1px solid " + popupBorder,
            borderRadius: 8,
            listStyle: "none",
            zIndex: 100,
            boxShadow: popupShadow,
            backdropFilter: "blur(8px)",
          }}
        >
          {props.options.map((o) => {
            const selected = o.value === props.value;
            return (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => {
                    props.onChange(o.value);
                    setOpen(false);
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "6px 10px",
                    background: selected
                      ? "rgba(99, 102, 241, 0.25)"
                      : "transparent",
                    color: "inherit",
                    border: "none",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected)
                      e.currentTarget.style.background =
                        "rgba(148, 163, 184, 0.15)";
                  }}
                  onMouseLeave={(e) => {
                    if (!selected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function fakeFetch<T>(ms: number, result: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(result), ms));
}
