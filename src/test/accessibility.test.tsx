import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it } from "vitest";
import { AccessibilityPanel } from "@/components/AccessibilityPanel";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});
afterEach(cleanup);

it("changes and persists the theme with the day/night switch and resets it", async () => {
  render(<AccessibilityPanel />);
  fireEvent.click(screen.getByRole("button", { name: "Accesibilidad" }));
  const toggle = screen.getByRole("switch", { name: "Modo oscuro" });
  expect(toggle).toHaveAttribute("aria-checked", "false");
  fireEvent.click(toggle);
  await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  expect(toggle).toHaveAttribute("aria-checked", "true");
  expect(JSON.parse(localStorage.getItem("loop-accessibility")!).theme).toBe("dark");
  fireEvent.click(screen.getByRole("button", { name: "Restablecer todas las preferencias" }));
  await waitFor(() => expect(document.documentElement).not.toHaveClass("dark"));
  expect(toggle).toHaveAttribute("aria-checked", "false");
});

it("restores saved preferences and resets them from the panel", async () => {
  localStorage.setItem(
    "loop-accessibility",
    JSON.stringify({ size: 130, theme: "dark", contrast: true }),
  );
  render(<AccessibilityPanel />);
  await waitFor(() => expect(document.documentElement.style.fontSize).toBe("130%"));
  expect(document.documentElement).toHaveClass("dark", "a11y-contrast");
  fireEvent.click(screen.getByRole("button", { name: "Accesibilidad" }));
  fireEvent.click(screen.getByRole("button", { name: "Restablecer todas las preferencias" }));
  await waitFor(() => expect(document.documentElement.style.fontSize).toBe("100%"));
  expect(document.documentElement).not.toHaveClass("dark");
  expect(document.documentElement).not.toHaveClass("a11y-contrast");
  expect(JSON.parse(localStorage.getItem("loop-accessibility")!).size).toBe(100);
});

it("ignores invalid stored settings and saves changes", async () => {
  localStorage.setItem(
    "loop-accessibility",
    JSON.stringify({ size: 900, theme: "invalid", motion: "false" }),
  );
  render(<AccessibilityPanel />);
  expect(document.documentElement.style.fontSize).toBe("100%");
  expect(document.documentElement).not.toHaveClass("a11y-motion");
  fireEvent.click(screen.getByRole("button", { name: "Accesibilidad" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Pausar animaciones y movimientos" }));
  await waitFor(() => expect(document.documentElement).toHaveClass("a11y-motion"));
  expect(JSON.parse(localStorage.getItem("loop-accessibility")!).motion).toBe(true);
});
