import type { Config, Session } from "./types";
import { AuthClient } from "./client";
export type NuxtSessionStatus = "loading" | "authenticated" | "unauthenticated";
export interface UseNuxtSessionOptions {
    /** Reuse an existing client instead of constructing one per composable usage. */
    client?: AuthClient;
    /** Optional configuration passed to the client constructor when `client` is not provided. */
    config?: Config;
    /** Automatically ensure the session on mount (default: true). */
    auto?: boolean;
}
/**
 * Nuxt composable mirroring the Next.js drop-in API.
 * Usage: `const { data, status, ensureSession, signOut } = useSession()`
 * Import from `@smis/sso-client/nuxt`.
 */
export declare function useSession(options?: UseNuxtSessionOptions): {
    data: {
        value: Session | null;
    };
    status: {
        value: NuxtSessionStatus;
    };
    ensureSession: () => Promise<Session | null>;
    signOut: () => Promise<void>;
};
