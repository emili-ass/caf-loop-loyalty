import { type AnchorHTMLAttributes, type ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetchCards: vi.fn() }));
vi.mock("@/hooks/use-session", () => ({ useSession: () => ({ ready: true, user: null }) }));
vi.mock("@/lib/loyalty.queries", () => ({ fetchMyCards: mocks.fetchCards }));
vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  const React = await import("react");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: React.forwardRef<
      HTMLAnchorElement,
      AnchorHTMLAttributes<HTMLAnchorElement> & {
        children?: ReactNode;
        to: string;
        params?: { cafeId: string };
        search?: { cafe?: string };
        activeProps?: unknown;
        activeOptions?: unknown;
      }
    >(
      (
        { to, params, search, activeProps: _activeProps, activeOptions: _activeOptions, ...props },
        ref,
      ) => (
        <a
          ref={ref}
          href={
            params ? `/demo/${params.cafeId}` : to + (search?.cafe ? `?cafe=${search.cafe}` : "")
          }
          {...props}
        />
      ),
    ),
  };
});
import { WalletHome } from "@/components/WalletHome";
import { WalletStack } from "@/components/WalletStack";
import { SiteNav } from "@/components/SiteNav";
import { sampleCards, sampleCafes } from "@/lib/wallet-data";

function withQueries(children: ReactNode) {
  return render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>,
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});
afterEach(cleanup);

it("keeps sample cards hidden until explicitly opened without querying private cards", async () => {
  withQueries(<WalletHome />);
  expect(screen.queryByRole("heading", { name: "La Molienda" })).toBeNull();
  expect(screen.getByText(/Escanea en la cafetería → guarda tu tarjeta/)).toBeInTheDocument();
  const demo = screen.getByRole("button", { name: "Explorar demostración sin cuenta" });
  expect(demo).toHaveAttribute("aria-expanded", "false");
  fireEvent.click(demo);
  expect(screen.getByRole("heading", { name: "La Molienda" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Café Tueste del Norte" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Patio 24" })).toBeInTheDocument();
  expect(mocks.fetchCards).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Ocultar demostración" }));
  expect(screen.queryByRole("heading", { name: "La Molienda" })).toBeNull();
});

it("opens every sample with an explicit expand button and link, without hover", () => {
  render(<WalletStack cards={sampleCards} cafes={sampleCafes} demo />);
  for (const cafe of sampleCafes) {
    const toggle = screen.getByRole("button", { name: new RegExp(`tarjeta de ${cafe.name}$`) });
    if (toggle.getAttribute("aria-expanded") !== "true") fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    const link = screen.getByRole("link", { name: `Ver cafetería ${cafe.name}, demostración` });
    expect(link).toHaveAttribute("href", `/demo/${cafe.id}`);
    link.focus();
    expect(link).toHaveFocus();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("link", { name: `Ver cafetería ${cafe.name}, demostración` }),
    ).toBeNull();
  }
});

it("retains the complete accessible name for a very long café name", () => {
  const cafe = {
    ...sampleCafes[0]!,
    name: "Café Tueste del Norte y Taller de Tostado de Especialidad Monterrey",
  };
  render(<WalletStack cards={[sampleCards[0]!]} cafes={[cafe]} demo />);
  expect(screen.getByRole("heading", { name: cafe.name })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: `Ver cafetería ${cafe.name}, demostración` }),
  ).toBeInTheDocument();
});

it("groups team links in an accessible menu that opens and closes with the keyboard", async () => {
  withQueries(<SiteNav />);
  expect(screen.getByRole("link", { name: "Inicio" })).toBeInTheDocument();
  expect(screen.queryByRole("menuitem", { name: "Empleados" })).toBeNull();
  const team = screen.getByRole("button", { name: "Acceso del equipo: empleados y propietario" });
  team.focus();
  fireEvent.keyDown(team, { key: "Enter" });
  expect(await screen.findByRole("menuitem", { name: "Empleados" })).toHaveAttribute(
    "href",
    "/empleados",
  );
  expect(screen.getByRole("menuitem", { name: "Propietario" })).toHaveAttribute(
    "href",
    "/propietario",
  );
  fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
  await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  await waitFor(() => expect(team).toHaveFocus());
});
