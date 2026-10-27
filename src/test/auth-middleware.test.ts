import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRequest: vi.fn(),
  createClient: vi.fn(),
  getClaims: vi.fn(),
}));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({ server: (handler: unknown) => handler }),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: mocks.getRequest }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// The middleware builder is replaced above so its real server handler can be exercised.
const run = requireSupabaseAuth as unknown as (args: {
  next: (args: unknown) => unknown;
}) => Promise<unknown>;
describe("authenticated server requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createClient.mockImplementation(() => ({ auth: { getClaims: mocks.getClaims } }));
    mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
    mocks.getRequest.mockReturnValue({
      headers: new Headers({ authorization: "Bearer header.payload.signature" }),
      runtime: {
        cloudflare: {
          env: {
            SUPABASE_URL: "https://preview.supabase.co",
            SUPABASE_PUBLISHABLE_KEY: "sb_publishable_preview",
          },
        },
      },
    });
  });
  it("uses Cloudflare request bindings and forwards the user's JWT", async () => {
    const next = vi.fn();
    await run({ next });
    expect(mocks.createClient).toHaveBeenCalledWith(
      "https://preview.supabase.co",
      "sb_publishable_preview",
      expect.objectContaining({
        global: expect.objectContaining({
          headers: { Authorization: "Bearer header.payload.signature" },
        }),
        auth: expect.objectContaining({ persistSession: false, autoRefreshToken: false }),
      }),
    );
    expect(mocks.getClaims).toHaveBeenCalledWith("header.payload.signature");
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ context: expect.objectContaining({ userId: "user-1" }) }),
    );
  });
  it("rejects requests with no bearer token before creating a client", async () => {
    const request = mocks.getRequest();
    request.headers.delete("authorization");
    await expect(run({ next: vi.fn() })).rejects.toThrow("Bearer token required");
    expect(mocks.createClient).not.toHaveBeenCalled();
  });
  it("does not authorize claims that Supabase rejects", async () => {
    mocks.getClaims.mockResolvedValue({ data: null, error: new Error("Invalid JWT") });
    const next = vi.fn();
    await expect(run({ next })).rejects.toThrow("Unauthorized");
    expect(next).not.toHaveBeenCalled();
  });
  it("creates a separate Supabase client for every request", async () => {
    await run({ next: vi.fn() });
    await run({ next: vi.fn() });
    expect(mocks.createClient).toHaveBeenCalledTimes(2);
    expect(mocks.createClient.mock.results[0]?.value).not.toBe(
      mocks.createClient.mock.results[1]?.value,
    );
  });
});
