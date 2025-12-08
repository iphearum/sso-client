export interface Config {
    /** Application key issued by SMIS (e.g., pp-#########, tk-gic-#########). Optional if provided via env. */
    appKey?: string;
    /** Base URL of the auth portal (e.g., https://auth.smis.itc.edu.kh). */
    authBaseUrl?: string;
    /** Relative path on the auth portal used to probe or start sessions. */
    probePath?: string;
    /** Preferred storage driver (overrides env default) */
    storage?: 'localStorage' | 'sessionStorage' | 'memory';
    /** Optional storage key for persisting the session locally. */
    storageKey?: string;
    /** Time allowed for the popup/probe to respond before failing (ms). */
    timeoutMs?: number;
    /** Interval used while polling whether the popup has responded (ms). */
    pollIntervalMs?: number;
    /** Optional override for fetch (defaults to global fetch). */
    fetch?: typeof fetch;
}
export interface Session {
    accessToken: string;
    refreshToken?: string;
    expiresAt: string;
}
export interface UserInfo {
    userId: string;
    username: string;
    roles: string[];
    permissions: string[];
    employeeId?: number | null;
    branches?: any[];
}
export interface Authorization {
    roles: string[];
    permissions: string[];
}
export interface ContextAuthorization {
    employeeId: number | null;
    branches: any[];
}
export interface StorageAdapter {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export interface AuthProbeMessage {
    type: 'smis:sso:session';
    payload: Session;
}
