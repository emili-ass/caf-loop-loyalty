import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LoopWelcome } from "@/components/LoopWelcome";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("reveals the wallet after the intro and does not repeat it in the same session", () => {
  const view = render(
    <LoopWelcome>
      <main>Mi cartera</main>
    </LoopWelcome>,
  );
  expect(screen.getByLabelText("Bienvenido a Loop")).toBeInTheDocument();
  expect(screen.queryByRole("main")).toBeNull();
  act(() => {
    vi.advanceTimersByTime(3200);
  });
  expect(screen.getByRole("main")).toBeVisible();
  expect(screen.queryByLabelText("Bienvenido a Loop")).toBeNull();
  view.unmount();
  render(
    <LoopWelcome>
      <main>Mi cartera</main>
    </LoopWelcome>,
  );
  expect(screen.queryByLabelText("Bienvenido a Loop")).toBeNull();
});

it("can be skipped immediately", () => {
  render(
    <LoopWelcome>
      <main>Mi cartera</main>
    </LoopWelcome>,
  );
  fireEvent.click(screen.getByRole("button", { name: /Saltar intro/ }));
  expect(screen.getByRole("main")).toBeVisible();
});

it("skips animation when reduced motion is requested", () => {
  vi.stubGlobal("matchMedia", () => ({ matches: true }));
  render(
    <LoopWelcome>
      <main>Mi cartera</main>
    </LoopWelcome>,
  );
  expect(screen.queryByLabelText("Bienvenido a Loop")).toBeNull();
  expect(screen.getByRole("main")).toBeVisible();
});
