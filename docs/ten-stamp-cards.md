# Ten-stamp welcome cards

La Molienda and Tueste del Norte sample cards have 10 positions and 2 welcome
stamps. Each uses a separate AI-generated illustration in `public/images/`.

For real cards, the UI reads `cafes.stamps_required` so it stays consistent with
the database even before migration. No client-side bonus is added to real balances.

Apply `drizzle/migrations/0001_ten_stamp_welcome.sql` to the intended database
after checking its definitions against `supabase/tests/audit-readonly.sql`.
The migration extends the existing 8-stamp configuration to support 10, adds
`initial_stamps` (default 0), and sets the two named cafés to 10 with a bonus of 2.
It preserves existing card balances. Other cafés keep their existing settings.
New cafés must be configured by trusted administration.

`join_cafe` grants the bonus only on insertion; repeats return the existing card.
`register_purchase` reads the café target and continues to check the authenticated
employee and active membership. Its idempotency conflict rules and row locks are
preserved. No new client write grants or role changes are introduced.

Run `bun supabase/tests/security.e2e.ts` against an isolated, migrated test project
using the environment variables documented in the test. It checks 8-stamp
regressions, 2-stamp welcome grants, 10-stamp rewards and purchase attribution.

The migration requires an administrative database connection. It has not been
applied by editing these files.
