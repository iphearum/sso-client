import { Authorization, Session, Config, ContextAuthorization } from "./types";
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
    loadAuthorizations(session?: Session): Promise<Authorization>;
    loadContextAuthorizations(session?: Session): Promise<ContextAuthorization>;
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
    }): Promise<Session>;
    /**
     * Signs out: calls the auth portal logout (best-effort) and clears all local state.
     */
    signOut(session?: Session): Promise<void>;
    /**
     * Switches user by clearing the current session and forcing a new sign-in.
     */
    switchUser(): Promise<Session>;
    private launchAuthProbe;
    private decodeAccessToken;
}
export declare const createAuthProbeResponse: (session: Session) => void;
