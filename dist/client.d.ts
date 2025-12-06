import { Authorization, Session, Config, ContextAuthorization } from "./types";
export declare class Client {
    private readonly config;
    private readonly storage;
    private readonly storageKey;
    private readonly timeoutMs;
    private readonly pollIntervalMs;
    private readonly authOrigin;
    constructor(config: Config);
    getCachedSession(): Session | null;
    ensureSession(): Promise<Session>;
    loadAuthorizations(session?: Session): Promise<Authorization>;
    loadContextAuthorizations(session?: Session): Promise<ContextAuthorization>;
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
}
export declare const createAuthProbeResponse: (session: Session) => void;
