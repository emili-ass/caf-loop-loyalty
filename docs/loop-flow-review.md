# Loop flow corrections

## Routes and boundaries

- `/`: real wallet (when signed in), with sample cards hidden until the visitor
  explicitly chooses to explore the demonstration. The three known sample cards
  are La Molienda, Café Tueste del Norte and Patio 24.
- `/demo/$cafeId`: public, read-only view. Its allowlist is derived from the local
  sample café/card pairs. Unknown IDs return not found. No private card query is
  used by the demo page.
- `/tarjeta`: authenticated customer cards only. Known old links with
  `demo=true&cafe=<known-sample-id>` redirect to the public sample route. A flag
  alone, an unknown ID or a flag on another private route never bypasses auth.
- `/empleados` and `/propietario`: existing authentication and membership checks
  remain unchanged; navigation is grouped under the accessible Equipo menu.
- `/acceso`: remounts its form on navigation (including changes in redirect or
  history entry), clearing stale recovery/confirmation state. Redirects are
  validated by `safeAuthPath`; password and Google authentication preserve the
  requested safe destination. Registration does not assign employee/owner roles.

## UI changes

Card disclosure buttons and open-café links are separate controls. Links occupy
their own normal-flow row; titles wrap without truncation. The measured collapsed
height includes the full card header, accommodating long names and larger text.
Touch uses explicit tap actions, not hover. Collapsed details are inert and hidden
from assistive technology. Keyboard users activate native buttons, follow links,
and retain visible focus. Team navigation uses the existing Radix menu, including
Escape dismissal and focus restoration.

The header uses two grid rows on narrow screens at normal text size. Enlarged
navigation may wrap to preserve all labels. Mobile tool icons retain accessible
names. The first-visit guide distinguishes samples, real cards and the pending
NFC/QR integration. Page metadata consistently uses Loop.

## Verification and pending checks

Automated tests cover all three public demo allowlist entries, unknown demo IDs,
protected routes with and without misleading flags, safe login destinations,
role navigation after recovery, eight-character registration validation,
autocomplete, password visibility, retained invalid form values, initially hidden
demos, card expansion without hover, long accessible names, and keyboard menu
opening/dismissal/focus restoration. These are DOM/router tests, not screenshots
or real-device layout checks.

Visual review is still required at desktop, 360, 390 and 430 CSS pixels, at normal
and enlarged text (150% and 200%). Check full names, expanded card actions, two-row
header at normal text size, reflow at larger text, touch disclosure, Tab/Space/Enter
and menu Escape. The browser tool returned "The browser access host is unavailable"
in this session, so those viewport checks must not be treated as completed.

Actual login, email delivery, password reset links, roles on the hosted backend,
and NFC/QR hardware are not verified by mocked tests. No new database/RLS changes
were made for these flow corrections. Existing pending migrations and hosted auth
configuration are not applied by these UI changes.
