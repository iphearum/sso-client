# @itc-smis/sso-client

A lightweight helper for SMIS SSO enabled applications. The library handles discovering an existing SMIS session via the shared auth portal, requesting a new session when needed, and fetching roles/permissions for the configured application key.

## Installation

```bash
npm install @itc-smis/sso-client
```

## Configuration

Each SMIS-issued application key identifies the target application and its authorization scope (examples: `pp-#########`, `pp-gic-#########`, `tk-####`, `tk-gic-#########`). Provide that key alongside the SMIS auth domain when creating the client (defaults to `https://auth.smis.itc.edu.kh` if not set via env/config):

```ts
import { AuthClient } from '@itc-smis/sso-client';

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

### Social sign-in (Google and other linked providers)

When the application has linked OIDC providers on the gateway (`linked_provider_keys`, e.g. `["google"]`), the probe login page already shows a "Continue with Google" button. To skip the password form entirely and send the popup straight to the identity provider, use `signInWithProvider`:

```ts
// Opens /auth/oidc/google/start?appKey=... in the popup; resolves with the
// SMIS session once the gateway finishes the Google callback. The Google
// account is matched/linked to the core SMIS account by the gateway
// (identity links), so roles/permissions are identical to password login.
const session = await client.signInWithProvider('google');

// Force a fresh Google sign-in even when a session is cached
await client.signInWithProvider('google', { force: true });
```

The provider key must be one of the app's linked providers on the gateway, otherwise the popup shows "Application is not assigned to this provider". See `examples/google-login.html` for a runnable browser demo.

### Dynamic provider buttons

Instead of hard-coding "Sign in with Google", ask the gateway which sign-in options the app has (`GET /api/sso/providers`) and render them:

```ts
const providers = await client.listSignInProviders();
// [{ key: 'google', name: 'Google', startUrl: 'https://…/auth/oidc/google/start?appKey=…',
//    iconUrl: 'https://…/static/icons/google.ico', primary: false }]
```

Adding/removing a provider in the SSO console then updates every app's UI with no code change.

### Redirect-mode sign-in (webviews, popup blockers)

Popups don't work in in-app webviews (Facebook/Instagram/Line), under strict popup blockers, or on COOP-isolated pages. Use the full-page redirect flow there:

```ts
// Leaves the page for the auth portal; comes back to redirectUri (default: current URL)
client.signInWithRedirect();                          // password/social chooser
client.signInWithRedirect({ providerKey: 'google' }); // straight to Google

// On page load (e.g. app bootstrap), pick up the returned session:
const session = client.handleRedirectCallback(); // null when the URL has no tokens
```

`handleRedirectCallback` stores the session and scrubs the token parameters from the address bar. Note that tokens transit briefly via the URL in this mode — prefer the popup flow when available.

### Silent session refresh

`ensureSession()` now tries a silent refresh (`POST /auth/refresh` with the cached refresh token) before opening the interactive popup, so users are only prompted when the refresh token is missing, expired, or revoked. You can also refresh explicitly:

```ts
const session = await client.refreshSession(); // null if not refreshable
```

### Handling the probe in the auth portal

The auth portal should post the active session back to the opener after login or session discovery. The probe URL now looks like `https://auth.smis.itc.edu.kh/sso/probe?token=<jwt>` where the JWT is HS256-signed with the appKey and includes `appKey`, `iat`, `exp`. The helper below can be used by the `auth.smis.itc.edu.kh` UI to respond once the session is established:

```ts
import { createAuthProbeResponse } from '@itc-smis/sso-client';

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

- `SMIS_AUTH_BASE_URL` (or `NEXT_PUBLIC_SMIS_AUTH_BASE_URL`/`NEXT_PUBLIC_AUTH_BASE_URL`/`BASE_URL`) – base URL of the auth portal (defaults to `https://auth.smis.itc.edu.kh` when unset)
- `SMIS_PROBE_PATH` (or `NEXT_PUBLIC_SMIS_PROBE_PATH`) – path used for the popup probe (defaults to `/sso/probe`)
- `SMIS_APP_KEY` (or `NEXT_PUBLIC_SMIS_APP_KEY`/`NEXT_PUBLIC_APP_KEY`/`APP_KEY`) – optional default application key (passing `appKey` in config is preferred)
- `SMIS_STORAGE` (or `NEXT_PUBLIC_SMIS_STORAGE`) (`localStorage`, `sessionStorage`, or `memory`) – default storage driver
- `SMIS_STORAGE_KEY` (or `NEXT_PUBLIC_SMIS_STORAGE_KEY`) – default key used to store the session
- `SMIS_TIMEOUT_MS` (or `NEXT_PUBLIC_SMIS_TIMEOUT_MS`) – popup timeout before failing login
- `SMIS_POLL_INTERVAL_MS` (or `NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS`) – interval for detecting if the popup was closed prematurely

### If your app cannot read `.env*` in the client bundle

Some bundlers do not inline environment variables inside dependencies. In that case, pass the env map explicitly or set it at runtime:

```ts
import { setRuntimeEnv } from "@itc-smis/sso-client";

// Vite / Astro
setRuntimeEnv(import.meta.env);
```

```ts
import { AuthClient } from "@itc-smis/sso-client";

const client = new AuthClient({
  env: import.meta.env, // or process.env in a Node-only runtime
  appKey: "pp-123456789"
});
```

### Example session payload (ensureSession result)

```json
{
  "accessToken": "ey##",
  "refreshToken": "87511a80-###",
  "expiresAt": "2025-12-10T12:28:40.372Z"
}
```

### Using with NextAuth + useSession

You can hydrate NextAuth from an SMIS SSO session so `useSession()` reflects the SSO state. Swap your imports to `@itc-smis/sso-client/next` (a thin re-export of `next-auth/react` plus the SMIS-aware hook) to keep NextAuth synchronized automatically without touching the rest of your app code.

```tsx
// pages/_app.tsx
import { SessionProvider } from "@itc-smis/sso-client/next";

export default function App({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <Component {...pageProps} />
    </SessionProvider>
  );
}
```

```tsx
// app/page.tsx (client component)
import { useSession } from "@itc-smis/sso-client/next";

export default function Page() {
  const { status, data, update } = useSession({
    config: { appKey: "pp-123456789" },
    redirect: false,
  });

  return <pre>{JSON.stringify({ status, data }, null, 2)}</pre>;
}
```

Under the hood the hook calls `ensureSession()` and hydrates NextAuth with `signIn("credentials", { token, session })` once the SMIS session is available, so `useSession()` exposes the decoded token info and raw SSO session everywhere. Adapters for Nuxt, Laravel, and mobile clients will follow the same pattern so each framework can reuse the shared SSO session logic.

```ts
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { decodeJwtPayload } from "@itc-smis/sso-client";

export const authOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "SMIS",
      credentials: { token: {}, session: {} },
      authorize: (creds) => {
        if (!creds?.token) return null;
        const info = decodeJwtPayload(creds.token);
        const username = info.username ?? info.sub ?? "user";
        return {
          id: username,
          name: username,
          email: info.email,
          info,
          sso: creds.session ? JSON.parse(creds.session) : undefined,
        };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => ({ ...token, ...user }),
    session: ({ session, token }) => ({ ...session, ...token }),
  },
};
```

```tsx
// app/page.tsx (client component)
const { status, data } = useSession();
const syncSession = async () => {
  const sso = await client.ensureSession();
  await signIn("credentials", {
    token: sso.accessToken,
    session: JSON.stringify(sso),
    redirect: false,
  });
};

// To sign out: clear the remote session (best-effort) and drop NextAuth state
await client.signOut();
await signOut({ redirect: false });
```

After calling `syncSession`, `useSession()` exposes `data.sso` (raw session), `data.info` (decoded JWT), and standard `user` fields for downstream components.

## Error handling

- `ensureSession` throws if it runs outside the browser (no `window`) or if the user closes the probe window before login.
- `loadAuthorizations` throws if the auth portal responds with a non-OK status (for example, when the access token is invalid or expired).
- `user` throws if the access token is missing/invalid.

## Packaging helper (optional)

Bundle `dist/` into a single JSON file, optionally encrypted for distribution:

```bash
# Plain bundle -> dist-bundle.json
npm run bundle:dist

# Encrypted bundle -> dist-bundle.enc.json (set SMIS_BUNDLE_SECRET)
SMIS_BUNDLE_SECRET="passphrase" npm run bundle:dist -- --encrypt --out dist-bundle.enc.json
```

The bundle is framework-agnostic (Next, Nuxt, etc.) and can be unpacked by any platform that can decode base64/JSON; the encrypted form uses AES-256-GCM with scrypt key derivation.
