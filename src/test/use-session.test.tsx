import { act, renderHook, waitFor } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSession } from "@/hooks/use-session";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth } }));

describe("session lifecycle", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: auth.unsubscribe } },
    });
  });
  it("finishes loading after a session lookup fails", async () => {
    auth.getSession.mockRejectedValue(new Error("Offline"));
    const { result, unmount } = renderHook(useSession);
    await waitFor(() => expect(result.current.ready).toBe(true));
    expect(result.current.user).toBeNull();
    unmount();
    expect(auth.unsubscribe).toHaveBeenCalled();
  });
  it("does not overwrite a fresh auth event with a stale initial lookup", async () => {
    let resolve!: (value: { data: { session: null } }) => void;
    auth.getSession.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const { result } = renderHook(useSession);
    const callback = auth.onAuthStateChange.mock.calls[0]?.[0];
    const session = { user: { id: "current-user" } } as Session;
    act(() => callback("SIGNED_IN", session));
    await act(async () => {
      resolve({ data: { session: null } });
    });
    expect(result.current.user?.id).toBe("current-user");
  });
});
