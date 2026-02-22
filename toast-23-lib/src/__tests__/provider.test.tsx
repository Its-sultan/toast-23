/**
 * toast-23 — Provider Tests
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Toast23Provider } from "../provider";

describe("Toast23Provider", () => {
  it("renders children", () => {
    render(
      <Toast23Provider>
        <div data-testid="child">Hello</div>
      </Toast23Provider>,
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("accepts custom position prop", () => {
    render(
      <Toast23Provider position="bottom-center">
        <div>App</div>
      </Toast23Provider>,
    );
    expect(screen.getByText("App")).toBeInTheDocument();
  });

  it("accepts custom maxVisible prop", () => {
    render(
      <Toast23Provider maxVisible={3}>
        <div>App</div>
      </Toast23Provider>,
    );
    expect(screen.getByText("App")).toBeInTheDocument();
  });

  it("accepts custom duration prop", () => {
    render(
      <Toast23Provider duration={3000}>
        <div>App</div>
      </Toast23Provider>,
    );
    expect(screen.getByText("App")).toBeInTheDocument();
  });
});
