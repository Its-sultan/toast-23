/**
 * toast-23 — Group dismissal, pause-all, history hook tests.
 */
import { describe, it, expect } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import React from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";

function renderWithProvider(onMount: (toast: ReturnType<typeof useToast>) => void) {
  function Capture() {
    const t = useToast();
    React.useEffect(() => onMount(t), [t]);
    return null;
  }
  return render(
    <Toast23Provider>
      <Capture />
    </Toast23Provider>,
  );
}

describe("toast groups", () => {
  it("dismissGroup dismisses every toast with matching group", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("a", { group: "save", id: "a" });
      api!.success("b", { group: "save", id: "b" });
      api!.success("c", { id: "c" }); // no group
    });

    expect(await screen.findByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();

    act(() => api!.dismissGroup("save"));

    await waitFor(() => {
      const a = screen.getByText("a").closest(".toast23-item");
      const b = screen.getByText("b").closest(".toast23-item");
      const c = screen.getByText("c").closest(".toast23-item");
      expect(a?.classList.contains("toast23-item--exiting")).toBe(true);
      expect(b?.classList.contains("toast23-item--exiting")).toBe(true);
      expect(c?.classList.contains("toast23-item--exiting")).toBe(false);
    });
  });

  it("removeGroup instantly removes every toast with matching group", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("a", { group: "g" });
      api!.success("b", { group: "g" });
      api!.success("c");
    });
    expect(await screen.findByText("a")).toBeInTheDocument();

    act(() => api!.removeGroup("g"));

    await waitFor(() => {
      expect(screen.queryByText("a")).not.toBeInTheDocument();
      expect(screen.queryByText("b")).not.toBeInTheDocument();
      expect(screen.getByText("c")).toBeInTheDocument();
    });
  });
});

describe("toast history", () => {
  it("records dismissed toasts in newest-first order", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("first", { id: "first" });
      api!.error("second", { id: "second" });
    });

    act(() => {
      api!.dismiss("first");
      api!.dismiss("second");
    });

    await waitFor(() => {
      const h = api!.history();
      // newest first
      expect(h[0].id).toBe("second");
      expect(h[1].id).toBe("first");
    });
  });

  it("doesn't double-record a toast dismissed multiple times", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("only-once", { id: "x" });
    });
    act(() => {
      api!.dismiss("x");
      api!.dismiss("x");
      api!.dismiss("x");
    });

    await waitFor(() => {
      const entries = api!.history().filter((h) => h.id === "x");
      expect(entries).toHaveLength(1);
    });
  });

  it("fires onDismiss callback exactly once when the toast leaves state", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    let calls = 0;
    act(() => {
      api!.success("bye", { id: "z", onDismiss: () => calls++ });
    });
    act(() => {
      api!.dismiss("z");
      api!.dismiss("z");
    });

    await waitFor(() => expect(calls).toBe(1));
  });
});
