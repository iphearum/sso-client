# @smis/sso-client

A lightweight helper for SMIS SSO enabled applications. The library handles discovering an existing SMIS session via the shared auth portal, requesting a new session when needed, and fetching roles/permissions for the configured application key.

## Installation

```bash
npm install @smis/sso-client
```

## Configuration

Each SMIS-issued application key identifies the target application and its authorization scope (examples: `pp-#########`, `pp-gic-#########`, `tk-####`, `tk-gic-#########`). Provide that key alongside the SMIS auth domain when creating the client:

```ts
import { SmisSsoClient } from '@smis/sso-client';

const client = new SmisSsoClient({
  appKey: 'pp-123456789',
  authBaseUrl: 'https://auth.smis.itc.edu.kh',
  probePath: '/sso/probe' // optional, defaults to /sso/probe
});
```

## Browser usage

The client opens the SMIS auth portal in a short-lived window/tab to discover or create a session. Once a session arrives it is stored locally (using `localStorage` by default) until it expires.

```ts
const session = await client.ensureSession();
const { roles, permissions } = await client.loadAuthorizations(session);
const context = await client.loadContextAuthorizations(session); // branch/department contextual authz

// Common actions
await client.signIn({ force: true }); // force fresh login even if cached
await client.switchUser();             // shortcut: clear and force new login
await client.signOut();                // logout (best-effort) and clear local cache
```

### Handling the probe in the auth portal

The auth portal should post the active session back to the opener after login or session discovery. The helper below can be used by the `auth.smis.itc.edu.kh` UI to respond to the probe page once it has established the session:

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
const client = new SmisSsoClient({
  appKey: 'pp-123456789',
  authBaseUrl: 'https://auth.smis.itc.edu.kh',
  storageKey: 'my-app-session'
});
```

## Error handling

- `ensureSession` throws if it runs outside the browser (no `window`) or if the user closes the probe window before login.
- `loadAuthorizations` throws if the auth portal responds with a non-OK status (for example, when the access token is invalid or expired).
