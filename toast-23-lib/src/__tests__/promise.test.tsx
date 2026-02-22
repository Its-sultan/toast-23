/**
 * toast-23 — Promise API Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";

function TestComponent({
  onToast,
}: {
  onToast: (toast: ReturnType<typeof useToast>) => void;
}) {
  const toast = useToast();
  return (
    <button onClick={() => onToast(toast)} data-testid="trigger">
      Trigger
    </button>
  );
}

describe("toast.promise()", () => {
  it("shows loading then success", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;

    render(
      <Toast23Provider>
        <TestComponent onToast={(t) => (api = t)} />
      </Toast23Provider>,
    );

    await user.click(screen.getByTestId("trigger"));

    const promise = new Promise<string>((resolve) =>
      setTimeout(() => resolve("data"), 50),
    );

    act(() => {
      api.promise(promise, {
        loading: "Loading...",
        success: "Done!",
        error: "Failed!",
      });
    });

    expect(await screen.findByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Done!")).toBeInTheDocument();
    });
  });

  it("shows loading then error on rejection", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;

    render(
      <Toast23Provider>
        <TestComponent onToast={(t) => (api = t)} />
      </Toast23Provider>,
    );

    await user.click(screen.getByTestId("trigger"));

    const promise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("oops")), 50),
    );

    act(() => {
      api
        .promise(promise, {
          loading: "Loading...",
          success: "Done!",
          error: "Something went wrong",
        })
        .catch(() => {}); // suppress unhandled rejection
    });

    expect(await screen.findByText("Loading...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });
  });

  it("supports function messages for success/error", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;

    render(
      <Toast23Provider>
        <TestComponent onToast={(t) => (api = t)} />
      </Toast23Provider>,
    );

    await user.click(screen.getByTestId("trigger"));

    const promise = new Promise<{ name: string }>((resolve) =>
      setTimeout(() => resolve({ name: "Alice" }), 50),
    );

    act(() => {
      api.promise(promise, {
        loading: "Fetching...",
        success: (data) => `Hello, ${data.name}!`,
        error: (err) => `Error: ${err}`,
      });
    });

    await waitFor(() => {
      expect(screen.getByText("Hello, Alice!")).toBeInTheDocument();
    });
  });

  it("accepts a function that returns a promise", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;

    render(
      <Toast23Provider>
        <TestComponent onToast={(t) => (api = t)} />
      </Toast23Provider>,
    );

    await user.click(screen.getByTestId("trigger"));

    const promiseFn = vi.fn(
      () =>
        new Promise<string>((resolve) =>
          setTimeout(() => resolve("result"), 50),
        ),
    );

    act(() => {
      api.promise(promiseFn, {
        loading: "Running...",
        success: "Complete!",
        error: "Failed!",
      });
    });

    expect(promiseFn).toHaveBeenCalledOnce();
    expect(await screen.findByText("Running...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Complete!")).toBeInTheDocument();
    });
  });
});
