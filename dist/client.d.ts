import { Authorization, LinkResult, Session, SignInProvider, Config, ContextAuthorization, ServiceSessionGroup, ServiceSessionInfo } from "./types";
import type { UserInfo } from "./types";
export declare class AuthClient {
    private readonly config;
    private readonly storage;
    private readonly storageKey;
    private readonly timeoutMs;
    private readonly pollIntervalMs;
    private readonly authOrigin;
    private readonly resolvedConfig;
    constructor(config?: Config);
    getCachedSession(): Session | null;
    ensureSession(): Promise<Session>;
    /**
     * Exchanges the refresh token (given or cached) for a fresh session with no
     * user interaction. Returns null when no refresh token is available or the
     * gateway rejects it (revoked/expired/consent required).
     */
    refreshSession(refreshToken?: string): Promise<Session | null>;
    loadAuthorizations(session?: Session): Promise<Authorization>;
    loadContextAuthorizations(session?: Session): Promise<ContextAuthorization>;
    listSessions(session?: Session): Promise<ServiceSessionInfo[]>;
    listSessionServices(session?: Session): Promise<ServiceSessionGroup[]>;
    /**
     * Returns user/token info and (optionally) contextual details such as employeeId/branches.
     * Set { fetchContext: true } to include contextual authorizations.
     */
    user(options?: {
        fetchContext?: boolean;
        session?: Session;
    }): Promise<UserInfo>;
    /**
     * Clears the locally cached session only (no network calls).
     */
    clearSession(): void;
    /**
     * Signs in, forcing a fresh probe if `force` is true even when a cached session exists.
     */
    signIn(options?: {
        force?: boolean;
        prompt?: 'select_account';
    }): Promise<Session>;
    /**
     * Signs out: calls the auth portal logout (best-effort) and clears all local state.
     */
    signOut(session?: Session): Promise<void>;
    /**
     * Switches user by clearing the current session and forcing a new sign-in.
     */
    switchUser(): Promise<Session>;
    /**
     * Signs in through a linked OIDC/social provider (e.g. 'google'), skipping
     * the password form: the popup goes straight to the identity provider and
     * resolves with the SMIS session once the gateway completes the callback.
     * The provider must be listed in the app's linked providers on the gateway.
     */
    signInWithProvider(providerKey: string, options?: {
        force?: boolean;
    }): Promise<Session>;
    /**
     * Lists the sign-in options configured for this app on the gateway
     * (password-replacing primary provider and/or social buttons), so UIs can
     * render provider buttons dynamically instead of hard-coding them.
     */
    listSignInProviders(): Promise<SignInProvider[]>;
    /**
     * Full-page redirect sign-in for environments where popups don't work
     * (in-app webviews, popup blockers, COOP-isolated pages). Navigates away to
     * the auth portal; on return, call `handleRedirectCallback()` to pick up the
     * session from the URL. Pass `providerKey` to go straight to a social IdP.
     */
    signInWithRedirect(options?: {
        providerKey?: string;
        redirectUri?: string;
        prompt?: 'select_account';
    }): void;
    /**
     * Completes a redirect sign-in: reads the session from the current URL's
     * query string (accessToken/refreshToken/expiresAt), stores it, scrubs the
     * tokens from the address bar, and returns it. Returns null when the URL
     * carries no session (safe to call unconditionally on page load).
     */
    handleRedirectCallback(options?: {
        url?: string;
        replaceHistory?: boolean;
    }): Session | null;
    private currentUrlWithoutTokens;
    /**
     * Links an external provider account (e.g. a Google account) to the user
     * currently signed in at the auth portal, so both sign-in methods resolve
     * to the same SMIS account even when their emails differ. Requires an
     * active identity session at the gateway (i.e. the user signed in via the
     * popup at least once in this browser). Resolves with the link outcome;
     * inspect `result.linked` / `result.error`.
     */
    linkProvider(providerKey: string): Promise<LinkResult>;
    revokeSession(serviceSessionId: string, session?: Session): Promise<void>;
    revokeCurrentAppSessions(session?: Session): Promise<void>;
    private launchAuthProbe;
    private decodeAccessToken;
}
export declare const createAuthProbeResponse: (session: Session) => void;
