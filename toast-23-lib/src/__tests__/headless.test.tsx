/**
 * toast-23 — Headless hook tests.
 */
import { describe, it, expect } from "vitest";
import { render, act, waitFor } from "@testing-library/react";
import React from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";
import { useToast23Headless } from "../use-toast-headless";

describe("useToast23Headless", () => {
  it("returns the live queue and re-renders on changes", async () => {
    let apiRef: ReturnType<typeof useToast> | undefined;
    let headlessState: ReadonlyArray<unknown> = [];

    function Capture() {
      apiRef = useToast();
      const h = useToast23Headless();
      React.useEffect(() => {
        headlessState = h.toasts;
      });
      return null;
    }

    render(
      <Toast23Provider>
        <Capture />
      </Toast23Provider>,
    );

    await waitFor(() => expect(apiRef).toBeDefined());

    act(() => {
      apiRef!("first");
      apiRef!("second");
    });

    await waitFor(() => expect(headlessState.length).toBe(2));

    act(() => apiRef!.dismiss());

    // After dismiss, isExiting is true but toasts still in state until removeDelay
    await waitFor(() => {
      const exiting = (headlessState as any[]).filter((t) => t.isExiting);
      expect(exiting.length).toBe(2);
    });
  });

  it("throws when used outside a provider", () => {
    function Bad() {
      useToast23Headless();
      return null;
    }
    expect(() => render(<Bad />)).toThrow("[toast-23]");
  });
});
