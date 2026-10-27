# Loop Supabase setup

## Architecture

Loop uses React 19, TanStack Start/Router, React Query, TypeScript, Vite 8,
Tailwind 4, and Nitro 3. Supabase JS is already installed. The existing singleton
client, Lovable preview storage, and request-scoped authenticated middleware are
reused. Public demo content and the current design are preserved.

The integration branch is based on `design/loop-monochrome-brand`. Its PR targets
that branch to avoid mixing existing design work with the integration. Nothing
is merged into main or deployed by this work. No schema migration is applied.

## Connect a project

1. In the intended Supabase project's **Connect** dialog, copy its Project URL
   and public **publishable** key. Keys are also under Settings → API Keys.
2. Copy `.env.example` to `.env.local`, then set the four variables below. Use
   the same project for browser and server. The existing `.env` is kept locally
   but removed from Git tracking. Existing published history is not rewritten.
3. Inspect the project's actual schema before connecting a different database.
   `drizzle/migrations/0000_loyalty_core.sql` describes the existing schema; do
   not apply it to a populated database without reviewing conflicts.
4. Under Authentication → URL Configuration, set Site URL and allow the exact
   local and preview URLs ending in `/tarjeta`, `/reset-password`, and `/acceso`.
   Use the local origin printed by `npm run dev`.
5. Keep email confirmation enabled for production and configure email delivery.
   Verify confirmation and recovery using a disposable inbox.
6. Restart `npm run dev` and run `npm run check:supabase`. Rebuild after changing
   `VITE_*` values, which are embedded at build time.

| Variable                        | Where required              | Value                                                                      |
| ------------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Browser build               | Project URL                                                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Browser build               | Public publishable key or legacy anon JWT                                  |
| `SUPABASE_URL`                  | Server runtime, recommended | Same project URL; existing Lovable private transport URLs remain supported |
| `SUPABASE_PUBLISHABLE_KEY`      | Server runtime, recommended | Same public key                                                            |

The running website needs no administrative key. Configuration rejects secret
and service-role keys, including legacy service-role JWTs. Validation occurs
before building to prevent accidental privileged-key bundling. The unused admin
client has an explicit server-only import guard.

Google login retains the existing Lovable OAuth integration. Connecting an
unrelated Supabase project does not automatically migrate that provider or users.
Email/password authentication uses Supabase directly.

## Existing schema and tenant boundaries

| Object          | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `cafes`         | Public café details, owner updates to permitted columns        |
| `profiles`      | Auth-trigger-created profiles; users update their display name |
| `cafe_members`  | Active owner/employee roles per café                           |
| `loyalty_cards` | One customer card per café                                     |
| `purchases`     | Staff-confirmed purchases/visits                               |
| `stamp_events`  | Stamp ledger; eight stamps earn a reward                       |
| `redemptions`   | Reward ledger with café-scoped idempotency                     |

`loyalty.queries.ts` provides personal-card reads, café-scoped statistics, and
validated profile/café updates under RLS. No new editing screens are added.
`staff.ts` reads the current user's active memberships. Personal-card queries
filter by customer even when a staff role allows broader reads.

Insertions and counter updates use only existing server wrappers `joinCafe`,
`registerPurchase`, and `redeemReward`, which forward the user's JWT to the SQL
functions. SQL checks `auth.uid()` and active café staff membership, locks cards,
and enforces operation-table/café idempotency. No privileged client writes are
introduced. Roles never live on profiles.

Visits are represented by confirmed purchases. There is no separate points
currency, self-service café signup, or staff invitation UI. Café provisioning and
staff assignment remain trusted administration tasks; no new schema is invented.

The checked-in SQL enables RLS on all seven tables and gives clients SELECT-only
access to operational tables. Profile and café updates have narrow column grants
and self/owner policies. Live policy metadata is not available with a public key:
run `supabase/tests/audit-readonly.sql` in the project's SQL Editor to inspect
actual RLS flags, policies, grants, and function definitions without reading
customer records or changing anything.

## Cloudflare Pages preview

The default `npm run build` retains the existing Workers target. For Pages,
`npm run build:pages` generates `dist/_worker.js/index.js`, assets, `_routes.json`,
and `_headers`. Deploying static assets alone would break server functions.

In Cloudflare Workers & Pages → your Pages project → Settings:

1. Leave production branch/settings unchanged. Prefer a separate preview-only
   Pages project, using `feat/supabase-production-integration` as a preview branch.
2. Set build command `npm run build:pages`, output directory `dist`, and
   `NODE_VERSION=24`. Use `bun install --frozen-lockfile` with the checked-in
   `bun.lock`, or `npm install` if your build uses npm.
3. Set all four variables above for **Preview**, using a disposable Supabase
   project. `VITE_*` must be available at build time; the other two are runtime
   bindings. Middleware reads Nitro's request-scoped Cloudflare bindings before
   Node environment variables, with public build settings as fallback.
4. Enable `nodejs_compat` with compatibility date `2026-10-24` or later. Do not
   add service-role credentials to the website.
5. Allow the resulting preview origin in Supabase Auth. Trigger only a preview
   build and test registration, login/logout, persistence, recovery, cards,
   staff operations, and owner statistics before a production decision.

Optional local worker preview, after installing Wrangler:

```sh
npm run build:pages
npx wrangler pages dev dist --compatibility-date=2026-10-24 --compatibility-flag=nodejs_compat
```

Put local runtime bindings in ignored `.dev.vars` if needed. No remote preview
or production deployment is created by the implementation work. An existing Git
integration may automatically create a branch preview when the PR is published.

## Validation

```sh
npm run typecheck
npm test
npm run lint
npm run build
npm run build:pages
npm run check:supabase
```

The smoke script is read-only: it checks authentication settings, café schema,
and private-table anonymous access using counts. It never retrieves customer
records, signs in, writes data, or prints credentials. This cannot prove
authenticated tenant isolation.

For security tests, configure the isolated project's four variables in ignored
`.env.local`, plus:

```dotenv
SUPABASE_SERVICE_ROLE_KEY=YOUR_ISOLATED_TEST_ADMIN_KEY
LOOP_SECURITY_TEST_PROJECT_URL=https://YOUR_ISOLATED_PROJECT.supabase.co
```

The confirmation URL must exactly equal `SUPABASE_URL`. Never point this suite
at production. It creates two café fixtures, six `@test.invalid` users, and their
loyalty records, then deletes only those fixture IDs. It does not require demo
cafés. A reviewed copy of the existing schema must already be installed.

```sh
npm run test:security
```

Node 24 runs this TypeScript script directly. The original Bun invocation also
works: `bun supabase/tests/security.e2e.ts`. Keep administrative credentials
local; do not paste them into chat, PRs, or browser variables. These tests verify
password login and database isolation; email delivery and full browser flows
still require preview testing with a disposable inbox.

Exact results and release limitations are in `docs/supabase-validation.md`.

References: [Supabase keys](https://supabase.com/docs/guides/getting-started/api-keys),
[JWT verification](https://supabase.com/docs/reference/javascript/auth-getclaims),
[Nitro Cloudflare presets](https://nitro.build/deploy/providers/cloudflare),
[Pages bindings](https://developers.cloudflare.com/pages/functions/bindings/).
