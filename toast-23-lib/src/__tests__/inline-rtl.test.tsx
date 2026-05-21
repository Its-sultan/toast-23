/**
 * toast-23 — Inline mode + RTL tests.
 */
import { describe, it, expect } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import React, { useRef, useEffect, useState } from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";

describe("inline mode (target prop)", () => {
  it("renders toasts inside the target element", async () => {
    function App() {
      const [target, setTarget] = useState<HTMLDivElement | null>(null);
      return (
        <div>
          <div data-testid="host" ref={setTarget}>
            host
          </div>
          {target && (
            <Toast23Provider target={target}>
              <Capture />
            </Toast23Provider>
          )}
        </div>
      );
    }

    let api: ReturnType<typeof useToast> | undefined;
    function Capture() {
      const t = useToast();
      useEffect(() => {
        api = t;
      });
      return null;
    }

    render(<App />);
    await waitFor(() => expect(api).toBeDefined());

    act(() => api!.success("inside"));

    const host = screen.getByTestId("host");
    await waitFor(() => {
      // toast should be a descendant of host, not document.body directly
      expect(host.querySelector(".toast23-item")).not.toBeNull();
    });
  });
});

describe("RTL direction", () => {
  it("adds toast23-container--rtl class and dir attribute when dir=rtl", async () => {
    function Capture() {
      const t = useToast();
      useEffect(() => {
        t("hi");
      }, [t]);
      return null;
    }

    render(
      <Toast23Provider dir="rtl">
        <Capture />
      </Toast23Provider>,
    );

    await waitFor(() => {
      const container = document.querySelector(".toast23-container");
      expect(container?.classList.contains("toast23-container--rtl")).toBe(true);
      expect(container?.getAttribute("dir")).toBe("rtl");
    });
  });
});
