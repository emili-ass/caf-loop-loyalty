import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  login: vi.fn(),
  signup: vi.fn(),
  reset: vi.fn(),
  destination: "/tarjeta",
  location: { href: "/acceso", state: { __TSR_key: "initial" } },
}));
vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => mocks.navigate,
  useLocation: () => mocks.location,
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      signInWithPassword: mocks.login,
      signUp: mocks.signup,
      resetPasswordForEmail: mocks.reset,
    },
  },
}));
vi.mock("@/integrations/lovable/index", () => ({
  lovable: { auth: { signInWithOAuth: vi.fn() } },
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), warning: vi.fn() } }));
import { Acceso, AccessForm, Route } from "@/routes/acceso";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.destination = "/tarjeta";
  mocks.location = { href: "/acceso", state: { __TSR_key: "initial" } };
  vi.spyOn(Route, "useSearch").mockImplementation(() => ({ redirect: mocks.destination }));
  mocks.login.mockResolvedValue({
    data: { user: { email_confirmed_at: "2026-10-31" } },
    error: null,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it.each(["/empleados", "/propietario"])(
  "resets recovery when navigating to %s and uses its role context",
  (destination) => {
    const view = render(<Acceso />);
    fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste tu contraseña?" }));
    expect(screen.getByRole("heading", { name: "Recuperar contraseña" })).toBeInTheDocument();
    expect(screen.getByText(/te enviaremos un enlace/)).toBeInTheDocument();
    mocks.destination = destination;
    mocks.location = { href: `/acceso?redirect=${destination}`, state: { __TSR_key: "next" } };
    view.rerender(<Acceso />);
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recuperar contraseña" })).toBeNull();
    expect(
      screen.getByText(
        destination === "/empleados" ? /Acceso de empleados/ : /Acceso de propietarios/,
      ),
    ).toBeInTheDocument();
  },
);

it.each([
  ["/empleados?cafe=chosen", "/empleados?cafe=chosen"],
  ["/propietario", "/propietario"],
  ["https://evil.invalid", "/tarjeta"],
])("preserves only safe login destinations: %s", async (redirect, expected) => {
  render(<AccessForm redirect={redirect} />);
  fireEvent.change(screen.getByLabelText("Correo electrónico"), {
    target: { value: "staff@test.invalid" },
  });
  fireEvent.change(screen.getByLabelText("Contraseña", { exact: true }), {
    target: { value: "password123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith({ to: expected }));
});

it("shows the eight-character requirement, supports password visibility and preserves invalid form data", async () => {
  render(<AccessForm />);
  fireEvent.click(screen.getByRole("button", { name: "Registrarme" }));
  const name = screen.getByLabelText("Nombre");
  const email = screen.getByLabelText("Correo electrónico");
  const password = screen.getByLabelText("Contraseña", { exact: true });
  expect(name).toHaveAttribute("autocomplete", "name");
  expect(email).toHaveAttribute("autocomplete", "email");
  expect(password).toHaveAttribute("autocomplete", "new-password");
  expect(screen.getByText("Usa al menos 8 caracteres.")).toBeInTheDocument();
  fireEvent.change(name, { target: { value: "Ana López" } });
  fireEvent.change(email, { target: { value: "ana@test.invalid" } });
  fireEvent.change(password, { target: { value: "short" } });
  fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
  expect(password).toHaveAttribute("type", "text");
  expect(mocks.signup).not.toHaveBeenCalled();
  fireEvent.submit(screen.getByRole("button", { name: "Crear cuenta" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("8 caracteres");
  expect(mocks.signup).not.toHaveBeenCalled();
  expect(password).toHaveValue("short");
  expect(name).toHaveValue("Ana López");
  expect(email).toHaveValue("ana@test.invalid");
});
