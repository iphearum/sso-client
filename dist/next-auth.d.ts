import type { Config, Session } from "./types";
import { AuthClient } from "./client";
export type NextAuthStatus = "authenticated" | "unauthenticated" | "loading";
export interface UseSessionLike {
    status: NextAuthStatus;
    data?: Record<string, any> | null;
    update?: (data?: any) => Promise<any>;
}
export type NextAuthSignIn = (provider?: string, options?: Record<string, unknown>) => Promise<unknown>;
export interface EnsureNextAuthSessionOptions {
    providerId?: string;
    redirect?: boolean;
    payload?: Record<string, unknown>;
    session?: Session;
}
export interface UseSmisSessionOptions extends EnsureNextAuthSessionOptions {
    client?: NextAuthClient;
    config?: Config;
}
export interface SmisSignInOptions extends EnsureNextAuthSessionOptions {
    client?: NextAuthClient;
    config?: Config;
    force?: boolean;
}
export interface SmisSignOutOptions extends Record<string, unknown> {
    client?: NextAuthClient;
    config?: Config;
}
export interface NextAuthAdapter {
    sessionHook: UseSessionLike;
    signIn: NextAuthSignIn;
}
/**
 * Thin wrapper around AuthClient that knows how to hydrate NextAuth's session.
 */
export declare class NextAuthClient extends AuthClient {
    ensureNextAuthSession(adapter: NextAuthAdapter, options?: EnsureNextAuthSessionOptions): Promise<Session>;
}
export declare function signIn(options?: SmisSignInOptions): Promise<Session>;
export declare function signOut(options?: SmisSignOutOptions): Promise<void>;
/**
 * Drop-in replacement for NextAuth's `useSession` that stays in sync with SMIS SSO.
 */
export declare function useSession(options?: UseSmisSessionOptions): import("next-auth/react").UseSessionResponse<any>;
