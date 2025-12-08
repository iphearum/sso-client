# @smis/sso-client

A lightweight helper for SMIS SSO enabled applications. The library handles discovering an existing SMIS session via the shared auth portal, requesting a new session when needed, and fetching roles/permissions for the configured application key.

## Installation

```bash
npm install @smis/sso-client
```

## Configuration

Each SMIS-issued application key identifies the target application and its authorization scope (examples: `pp-#########`, `pp-gic-#########`, `tk-####`, `tk-gic-#########`). Provide that key alongside the SMIS auth domain when creating the client (defaults to `https://auth.smis.itc.edu.kh` if not set via env/config):

```ts
import { AuthClient } from '@smis/sso-client';

// Preferred: supply authBaseUrl directly (fallback default: https://auth.smis.itc.edu.kh)
const client = new AuthClient({
  appKey: 'pp-123456789',             // required unless set via SMIS_APP_KEY
  authBaseUrl: 'https://auth.smis.itc.edu.kh',
  probePath: '/sso/probe',            // optional, defaults to /sso/probe
  storage: 'localStorage',            // optional, overrides env/default storage driver
  storageKey: 'smis-sso:pp-123456789' // optional, overrides env/default storage key
});

// Or rely on env defaults (see .env.example):
// const client = new AuthClient({ appKey: 'pp-123456789' }); // uses env for authBaseUrl if present, else defaults
// const client = new AuthClient(); // if SMIS_APP_KEY is set in env; authBaseUrl falls back to env or https://auth.smis.itc.edu.kh
```

## Browser usage

The client opens the SMIS auth portal in a short-lived window/tab to discover or create a session. It now signs a short-lived JWT with your `appKey` and passes it as `token` (HS256) to `/sso/probe`; the gateway verifies this before issuing session tokens. Once a session arrives it is stored locally (using `localStorage` by default) until it expires.

```ts
// Opens /sso/probe?token=<hs256 JWT signed with your appKey>
const session = await client.ensureSession();
const { roles, permissions } = await client.loadAuthorizations(session);
const context = await client.loadContextAuthorizations(session); // branch/department contextual authz

// Get user info from access token (and optionally context such as employeeId)
const user = await client.user(); // { userId, username, roles, permissions }
const userWithContext = await client.user({ fetchContext: true }); // adds employeeId, branches if available

// Common actions
await client.signIn({ force: true }); // force fresh login even if cached
await client.switchUser();            // shortcut: clear and force new login
await client.signOut();               // logout (best-effort) and clear local cache
```

### Handling the probe in the auth portal

The auth portal should post the active session back to the opener after login or session discovery. The probe URL now looks like `https://auth.smis.itc.edu.kh/sso/probe?token=<jwt>` where the JWT is HS256-signed with the appKey and includes `appKey`, `iat`, `exp`. The helper below can be used by the `auth.smis.itc.edu.kh` UI to respond once the session is established:

```ts
import { createAuthProbeResponse } from '@smis/sso-client';

// after the user signs in and a session is available
authApi.getSession().then((session) => {
  createAuthProbeResponse({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
    expiresAt: session.expiresAt
  });
});
```

### Custom storage

Provide your own `StorageAdapter` to control how the session is persisted (for example, to encrypt content or to store it in-memory during SSR):

```ts
const client = new AuthClient({
  appKey: 'pp-123456789', // required unless SMIS_APP_KEY is set
  authBaseUrl: 'https://auth.smis.itc.edu.kh',
  storage: 'sessionStorage',
  storageKey: 'my-app-session'
});
```

### Environment defaults

You can set defaults via environment variables (bundlers like Vite/Next can inline them at build time). Copy `.env.example` to `.env` and adjust:

- `SMIS_AUTH_BASE_URL` (or `NEXT_PUBLIC_SMIS_AUTH_BASE_URL`/`NEXT_PUBLIC_AUTH_BASE_URL`) – base URL of the auth portal (defaults to `https://auth.smis.itc.edu.kh` when unset)
- `SMIS_PROBE_PATH` (or `NEXT_PUBLIC_SMIS_PROBE_PATH`) – path used for the popup probe (defaults to `/sso/probe`)
- `SMIS_APP_KEY` (or `NEXT_PUBLIC_SMIS_APP_KEY`/`NEXT_PUBLIC_APP_KEY`) – optional default application key (passing `appKey` in config is preferred)
- `SMIS_STORAGE` (or `NEXT_PUBLIC_SMIS_STORAGE`) (`localStorage`, `sessionStorage`, or `memory`) – default storage driver
- `SMIS_STORAGE_KEY` (or `NEXT_PUBLIC_SMIS_STORAGE_KEY`) – default key used to store the session
- `SMIS_TIMEOUT_MS` (or `NEXT_PUBLIC_SMIS_TIMEOUT_MS`) – popup timeout before failing login
- `SMIS_POLL_INTERVAL_MS` (or `NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS`) – interval for detecting if the popup was closed prematurely

## Error handling

- `ensureSession` throws if it runs outside the browser (no `window`) or if the user closes the probe window before login.
- `loadAuthorizations` throws if the auth portal responds with a non-OK status (for example, when the access token is invalid or expired).
