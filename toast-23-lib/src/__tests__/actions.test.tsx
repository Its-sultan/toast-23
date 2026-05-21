/**
 * toast-23 — Action button + confirm tests.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

describe("action buttons", () => {
  it("renders an action button and fires its onClick", async () => {
    const onClick = vi.fn();
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("Saved", {
        action: { label: "Undo", onClick },
      });
    });

    const btn = await screen.findByRole("button", { name: "Undo" });
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("dismisses the toast by default after action click", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("Saved", {
        action: { label: "Undo", onClick: () => {} },
      });
    });

    const btn = await screen.findByRole("button", { name: "Undo" });
    await userEvent.click(btn);

    await waitFor(() => {
      const item = document.querySelector(".toast23-item");
      // After click, toast should be exiting
      expect(item?.classList.contains("toast23-item--exiting")).toBe(true);
    });
  });

  it("dismissOnClick: false keeps the toast open", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    act(() => {
      api!.success("Saved", {
        action: { label: "Pin", onClick: () => {}, dismissOnClick: false },
      });
    });

    const btn = await screen.findByRole("button", { name: "Pin" });
    await userEvent.click(btn);

    // The toast item should still be present without exiting
    const item = document.querySelector(".toast23-item");
    expect(item?.classList.contains("toast23-item--exiting")).toBe(false);
  });
});

describe("toast.confirm()", () => {
  it("resolves to true when the confirm button is clicked", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    let resultPromise: Promise<boolean>;
    act(() => {
      resultPromise = api!.confirm("Delete?", {
        confirmLabel: "Yes",
        cancelLabel: "No",
      });
    });

    const yes = await screen.findByRole("button", { name: "Yes" });
    await userEvent.click(yes);
    await expect(resultPromise!).resolves.toBe(true);
  });

  it("resolves to false when the cancel button is clicked", async () => {
    let api: ReturnType<typeof useToast> | undefined;
    renderWithProvider((t) => (api = t));
    await waitFor(() => expect(api).toBeDefined());

    let resultPromise: Promise<boolean>;
    act(() => {
      resultPromise = api!.confirm("Delete?", {
        confirmLabel: "Yes",
        cancelLabel: "No",
      });
    });

    const no = await screen.findByRole("button", { name: "No" });
    await userEvent.click(no);
    await expect(resultPromise!).resolves.toBe(false);
  });
});
