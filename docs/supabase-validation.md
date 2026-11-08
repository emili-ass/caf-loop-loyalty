# Supabase integration validation

Validation date: 2026-10-27. Branch: `feat/supabase-production-integration`.
Base: `design/loop-monochrome-brand`. No production deployment, schema migration,
customer write, or merge was performed.

## Verified

| Check                      | Result                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `npm run typecheck`        | Passed                                                                                     |
| `npm test`                 | 30 tests passed across 7 files                                                             |
| `npm run lint`             | Passed with 0 errors; 6 existing UI Fast Refresh warnings                                  |
| `npm run build`            | Passed; original Workers target retained                                                   |
| `npm run build:pages`      | Passed; worker and Pages routes/assets generated under dist                                |
| Fake secret-key build test | Correctly refused configuration before bundling                                            |
| `npm run check:supabase`   | Auth HTTP 200, cafe schema reachable, no anonymous rows accessible in all 6 private tables |
| `git diff --check`         | Passed                                                                                     |

Unit tests cover configuration rejection, auth/session races, Cloudflare runtime
bindings, bearer verification failures, request-specific clients, customer query
filters, narrow update payloads, safe redirects, and membership errors. They do
not substitute for real authenticated database tests.

## Pending release checks

- The user is preparing an isolated Supabase test project; `.env.local` was not
  present at validation time. No password login, stamp/reward mutation, or live
  authenticated tenant-isolation test has been run.
- Run `npm run test:security` only after setting the isolated project and explicit
  confirmation URL as documented. The suite creates and deletes fixtures.
- Inspect actual policy metadata with `supabase/tests/audit-readonly.sql`; only
  the checked-in schema and public API behavior were available for this audit.
- Confirmation/recovery email delivery, real Google OAuth, browser flows, and a
  deployed Cloudflare preview remain unverified. Wrangler is not installed here.
- Existing non-fatal build warnings concern a large client chunk, the upstream
  tsconfig-paths plugin, and Nitro bundling options. Dependency versions were not
  changed. These are separate from a successful integration build.
- Business provisioning and staff invitations remain trusted administration; the
  schema models stamps and confirmed purchases, not a separate points system.

The public stylesheet is unchanged. Public landing-page changes below are
formatting only. The pre-existing `src/routeTree.gen.ts` working-tree status is
not included in this integration commit. Existing published environment history
is retained; if private credentials were ever committed previously, rotate them
through Supabase rather than rewriting Lovable history. No private credential
values were needed or printed during this work.

## Files

This includes the earlier authorized integration repairs in the same workspace.

| File                                              | Change                                                                                  |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `.env`                                            | Remove from Git only; retain local file, no history rewrite.                            |
| `.gitignore`                                      | Exclude environment and local runtime credential files.                                 |
| `.prettierrc`                                     | Windows-compatible line ending formatting.                                              |
| `README.md`                                       | Link setup and validation documentation.                                                |
| `package.json`                                    | Add typecheck, Pages build, read-only smoke, and isolated security commands.            |
| `src/components/SiteNav.tsx`                      | Logout error/loading handling and cache clearing; preserve navigation design.           |
| `src/hooks/use-session.ts`                        | Handle initial failures, unmounts, and stale lookup/auth-event races.                   |
| `src/integrations/supabase/auth-attacher.ts`      | Formatting only; runtime behavior unchanged.                                            |
| `src/integrations/supabase/auth-middleware.ts`    | Request-scoped user JWT verification and Cloudflare runtime bindings.                   |
| `src/integrations/supabase/client.server.ts`      | Enforce server-only administrative client import.                                       |
| `src/integrations/supabase/client.ts`             | Reuse existing singleton with validated browser-safe configuration.                     |
| `src/integrations/supabase/cron-auth.ts`          | Formatting only; runtime behavior unchanged.                                            |
| `src/integrations/supabase/previewAuthStorage.ts` | Formatting only; runtime behavior unchanged.                                            |
| `src/integrations/supabase/types.ts`              | Formatting only; runtime behavior unchanged.                                            |
| `src/lib/loyalty.functions.ts`                    | Retain SQL-only operational mutations; use current validator API.                       |
| `src/lib/staff.ts`                                | Propagate failures loading active caller memberships.                                   |
| `src/routes/__root.tsx`                           | Clear account caches on identity changes and validate stored redirects.                 |
| `src/routes/_authenticated/empleados.tsx`         | Show membership failures and reset operation state when switching cafes.                |
| `src/routes/_authenticated/propietario.tsx`       | Use cafe-scoped stats helper and display query failures.                                |
| `src/routes/_authenticated/tarjeta.tsx`           | Use personal query helper, visible errors, and recoverable join requests.               |
| `src/routes/acceso.tsx`                           | Registration/session handling, OAuth loading, network errors, safe redirects.           |
| `src/routes/index.tsx`                            | Formatting only; runtime behavior unchanged.                                            |
| `src/routes/reset-password.tsx`                   | Reliable recovery update loading and error cleanup.                                     |
| `supabase/tests/security.e2e.ts`                  | Typed results, isolated-project guard, self-contained cafe fixtures.                    |
| `vite.config.ts`                                  | Validate public keys before bundling; opt-in Pages preset preserves default target.     |
| `.env.example`                                    | Public configuration template and isolated-test-only settings.                          |
| `docs/supabase-setup.md`                          | Project setup, architecture, exact Cloudflare settings, and security test instructions. |
| `scripts/check-supabase.mjs`                      | Read-only API/schema and anonymous-access smoke checks.                                 |
| `src/integrations/supabase/config.ts`             | Shared URL/public-key validation, including legacy anon-key compatibility.              |
| `src/lib/auth-redirect.ts`                        | Validate same-origin destinations after authentication.                                 |
| `src/lib/loyalty.queries.ts`                      | Reusable tenant-scoped reads and narrow profile/cafe updates under RLS.                 |
| `src/test/auth-middleware.test.ts`                | Automated regression tests.                                                             |
| `src/test/auth-redirect.test.ts`                  | Automated regression tests.                                                             |
| `src/test/loyalty-queries.test.ts`                | Automated regression tests.                                                             |
| `src/test/staff.test.ts`                          | Automated regression tests.                                                             |
| `src/test/supabase-config.test.ts`                | Automated regression tests.                                                             |
| `src/test/use-session.test.tsx`                   | Automated regression tests.                                                             |
| `supabase/tests/audit-readonly.sql`               | Read-only metadata inspection for live RLS, grants, and functions.                      |
| `docs/supabase-validation.md`                     | Validation evidence, limitations, and complete file manifest.                           |
