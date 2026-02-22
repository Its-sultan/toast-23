/**
 * toast-23 — useToast Hook Tests
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { Toast23Provider } from "../provider";
import { useToast } from "../use-toast";

// Helper to render hook within provider
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

function renderWithProvider(
  onToast: (toast: ReturnType<typeof useToast>) => void,
  providerProps?: { duration?: number; position?: string; maxVisible?: number },
) {
  return render(
    <Toast23Provider {...(providerProps as any)}>
      <TestComponent onToast={onToast} />
    </Toast23Provider>,
  );
}

describe("useToast", () => {
  it("throws when used outside of Toast23Provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => {
      function Bad() {
        useToast();
        return null;
      }
      render(<Bad />);
    }).toThrow("[toast-23]");
    spy.mockRestore();
  });

  it("shows a default toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast("Hello world!");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("Hello world!")).toBeInTheDocument();
  });

  it("shows a success toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.success("Saved!");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("Saved!")).toBeInTheDocument();
  });

  it("shows an error toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.error("Failed!");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("Failed!")).toBeInTheDocument();
  });

  it("shows a warning toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.warning("Watch out!");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("Watch out!")).toBeInTheDocument();
  });

  it("shows an info toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.info("FYI!");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("FYI!")).toBeInTheDocument();
  });

  it("shows a loading toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.loading("Loading...");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("Loading...")).toBeInTheDocument();
  });

  it("shows a custom JSX toast", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.custom(<div data-testid="custom-content">Custom!</div>);
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByTestId("custom-content")).toBeInTheDocument();
  });

  it("returns a toast id", async () => {
    const user = userEvent.setup();
    let toastId = "";
    renderWithProvider((toast) => {
      toastId = toast("Test");
    });

    await user.click(screen.getByTestId("trigger"));
    expect(toastId).toBeTruthy();
    expect(toastId).toMatch(/^t23-/);
  });

  it("dismisses a toast by id", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    // First trigger to capture api
    await user.click(screen.getByTestId("trigger"));

    let toastId: string;
    act(() => {
      toastId = api("Dismissable");
    });
    expect(await screen.findByText("Dismissable")).toBeInTheDocument();

    act(() => {
      api.dismiss(toastId);
    });

    // Toast should start exiting (animation)
    await waitFor(() => {
      const el = screen.queryByText("Dismissable");
      if (el) {
        // It should have the exiting class
        expect(el.closest(".toast23-item")).toHaveClass(
          "toast23-item--exiting",
        );
      }
    });
  });

  it("dismisses all toasts", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    await user.click(screen.getByTestId("trigger"));

    act(() => {
      api("Toast 1");
      api("Toast 2");
      api("Toast 3");
    });
    expect(await screen.findByText("Toast 1")).toBeInTheDocument();
    expect(screen.getByText("Toast 2")).toBeInTheDocument();
    expect(screen.getByText("Toast 3")).toBeInTheDocument();

    act(() => {
      api.dismiss();
    });

    // All toasts should be exiting
    await waitFor(() => {
      const items = document.querySelectorAll(".toast23-item--exiting");
      expect(items.length).toBeGreaterThanOrEqual(3);
    });
  });

  it("removes a toast instantly", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    await user.click(screen.getByTestId("trigger"));

    let toastId: string;
    act(() => {
      toastId = api("Remove me");
    });
    expect(await screen.findByText("Remove me")).toBeInTheDocument();

    act(() => {
      api.remove(toastId!);
    });

    await waitFor(() => {
      expect(screen.queryByText("Remove me")).not.toBeInTheDocument();
    });
  });

  it("removes all toasts instantly", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    await user.click(screen.getByTestId("trigger"));

    act(() => {
      api("Remove 1");
      api("Remove 2");
    });
    expect(await screen.findByText("Remove 1")).toBeInTheDocument();

    act(() => {
      api.remove();
    });

    await waitFor(() => {
      expect(screen.queryByText("Remove 1")).not.toBeInTheDocument();
      expect(screen.queryByText("Remove 2")).not.toBeInTheDocument();
    });
  });

  it("updates an existing toast via id option", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    await user.click(screen.getByTestId("trigger"));

    let toastId: string;
    act(() => {
      toastId = api("Original");
    });
    expect(await screen.findByText("Original")).toBeInTheDocument();

    act(() => {
      api.success("Updated", { id: toastId });
    });

    await waitFor(() => {
      expect(screen.queryByText("Original")).not.toBeInTheDocument();
      expect(screen.getByText("Updated")).toBeInTheDocument();
    });
  });

  it("prevents duplicate toasts with same id", async () => {
    const user = userEvent.setup();
    let api: ReturnType<typeof useToast>;
    renderWithProvider((toast) => {
      api = toast;
    });

    await user.click(screen.getByTestId("trigger"));

    act(() => {
      api.success("Copied!", { id: "clipboard" });
      api.success("Copied!", { id: "clipboard" });
      api.success("Copied!", { id: "clipboard" });
    });

    await waitFor(() => {
      const matches = screen.getAllByText("Copied!");
      expect(matches).toHaveLength(1);
    });
  });

  it("shows toast with title", async () => {
    const user = userEvent.setup();
    renderWithProvider((toast) => {
      toast.success("Message body", { title: "My Title" });
    });

    await user.click(screen.getByTestId("trigger"));
    expect(await screen.findByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("Message body")).toBeInTheDocument();
  });
});
