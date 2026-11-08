# Quick email access

The hosted backend still decides whether confirmation is required. The browser
does not bypass authentication or grant café roles. To enable immediate access:

1. In the intended Supabase project, open Authentication → Sign In / Providers →
   Email and turn off Confirm Email. In Lovable Cloud, use the equivalent email
   authentication setting for the connected backend.
2. Save the change and test with a new disposable account. Existing unconfirmed
   accounts may still require confirmation; check their status in Auth Users.
3. New signups returning a session enter Loop immediately and show a dismissible
   warning in the upper-right corner that no email-link verification was done.

Supabase implicitly confirms email addresses when Confirm Email is off. Its
`email_confirmed_at` field then does not distinguish a clicked email link from
automatic confirmation. The warning therefore uses the direct signup result,
or a session explicitly lacking confirmation. It does not claim a separate,
persistent verification state for auto-confirmed accounts. Such a feature would
require a separate server-controlled verification flow.

`supabase/config.toml` sets `enable_confirmations = false` for local Supabase only;
editing it does not change the hosted project. No administrative backend access
is configured in this workspace, so the hosted setting was not changed.

## Current development tunnel

The supplied URL is `https://sq0zzp4v-8083.usw3.devtunnels.ms/`.
Dev Tunnels can show a Microsoft first-visit warning and, for private tunnels,
require Microsoft/GitHub access. These screens occur before Loop and cannot be
removed from its React application. For sharing without that intermediary, use
an ordinary deployed website URL. For local testing, use the localhost URL
printed by the development server.

If retaining email confirmation or password recovery, configure these exact
redirect URLs in hosted Auth (and update them when the tunnel changes):

- `https://sq0zzp4v-8083.usw3.devtunnels.ms/tarjeta`
- `https://sq0zzp4v-8083.usw3.devtunnels.ms/acceso`
- `https://sq0zzp4v-8083.usw3.devtunnels.ms/reset-password`

Set the hosted Site URL to the active app origin, not the old Lovable preview.
