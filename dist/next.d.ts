/**
 * Next.js/App Router-friendly surface that mirrors `next-auth/react` while
 * keeping SMIS SSO in sync. This allows apps to swap imports to
 * `@smis/sso-client/next` with minimal code changes.
 */
export { type NextAuthStatus, type UseSmisSessionOptions, type EnsureNextAuthSessionOptions, type NextAuthAdapter, NextAuthClient, useSession, } from "./next-auth";
export { signIn, signOut, useSession as useNextAuthSession, } from "./next-auth";
