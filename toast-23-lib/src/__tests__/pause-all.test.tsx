/**
 * toast-23 — pauseAll / resumeAll tests.
 */
import { describe, it, expect, vi } from "vitest";
import { render, act } from "@testing-library/react";
import React, { useEffect } from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";

describe("pauseAll / resumeAll", () => {
  it("pauseAll prevents the auto-dismiss timer from firing", async () => {
    vi.useFakeTimers();
    let api: ReturnType<typeof useToast> | undefined;

    function Capture() {
      const t = useToast();
      useEffect(() => {
        api = t;
      });
      return null;
    }

    render(
      <Toast23Provider duration={100}>
        <Capture />
      </Toast23Provider>,
    );

    await vi.runAllTimersAsync();
    expect(api).toBeDefined();

    act(() => {
      api!.pauseAll();
      api!("pinned");
    });

    // Advance well past the duration
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    const item = document.querySelector(".toast23-item");
    expect(item?.classList.contains("toast23-item--exiting")).toBe(false);

    // Resuming should re-arm the dismiss timer. Advancing past the duration
    // drives it deterministically — no `waitFor`, which would poll on a faked
    // interval that never advances and hang the test.
    act(() => {
      api!.resumeAll();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(200);
    });

    const resumed = document.querySelector(".toast23-item");
    expect(resumed?.classList.contains("toast23-item--exiting")).toBe(true);

    vi.useRealTimers();
  });
});
