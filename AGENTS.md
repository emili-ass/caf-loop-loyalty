<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Stamps, purchases and redemptions are written only by SECURITY DEFINER SQL functions (`register_purchase`, `redeem_reward`, `join_cafe`) that re-check `auth.uid()` and active café membership; clients have SELECT-only grants on those tables. Why: the browser and server layer must never be the only security check.
- Café roles live in `public.cafe_members` (per café), never on profiles. Why: prevents privilege escalation and supports multiple cafés.
- Idempotency keys are unique per (café, operation table); reusing a key with different data raises `idempotency_key_conflict`.
- Security tests live in `supabase/tests/security.e2e.ts` (run with `bun supabase/tests/security.e2e.ts`); they create and delete `@test.invalid` users. Run them after any schema/RLS change.
