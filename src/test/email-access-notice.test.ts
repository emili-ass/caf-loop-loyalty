import { beforeEach, expect, it, vi } from "vitest";
const warning = vi.hoisted(() => vi.fn());
vi.mock("sonner", () => ({ toast: { warning } }));
import { notifyEmailAccess } from "@/lib/email-access-notice";

beforeEach(() => warning.mockClear());

it("warns for direct signup even when Supabase auto-confirms the email", () => {
  notifyEmailAccess({ email_confirmed_at: "2026-10-31T12:00:00Z" }, true);
  expect(warning).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ position: "top-right" }),
  );
});

it("does not label an already confirmed returning user as unverified", () => {
  notifyEmailAccess({ email_confirmed_at: "2026-10-31T12:00:00Z" });
  expect(warning).not.toHaveBeenCalled();
});

it("warns if the authenticated session explicitly has no email confirmation", () => {
  notifyEmailAccess({});
  expect(warning).toHaveBeenCalledOnce();
});
