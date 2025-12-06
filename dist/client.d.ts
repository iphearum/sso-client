import { SmisAuthorization, SmisSession, SmisSsoConfig } from './types';
export declare class SmisSsoClient {
    private readonly config;
    private readonly storage;
    private readonly storageKey;
    private readonly timeoutMs;
    private readonly pollIntervalMs;
    private readonly authOrigin;
    constructor(config: SmisSsoConfig);
    getCachedSession(): SmisSession | null;
    ensureSession(): Promise<SmisSession>;
    loadAuthorizations(session?: SmisSession): Promise<SmisAuthorization>;
    loadContextAuthorizations(session?: SmisSession): Promise<unknown>;
    /**
     * Clears the locally cached session only (no network calls).
     */
    clearSession(): void;
    /**
     * Signs in, forcing a fresh probe if `force` is true even when a cached session exists.
     */
    signIn(options?: {
        force?: boolean;
    }): Promise<SmisSession>;
    /**
     * Signs out: calls the auth portal logout (best-effort) and clears all local state.
     */
    signOut(session?: SmisSession): Promise<void>;
    /**
     * Switches user by clearing the current session and forcing a new sign-in.
     */
    switchUser(): Promise<SmisSession>;
    private launchAuthProbe;
}
export declare const createAuthProbeResponse: (session: SmisSession) => void;
