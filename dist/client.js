"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthProbeResponse = exports.Client = void 0;
const http_1 = require("./http");
const storage_1 = require("./storage");
class Client {
    constructor(config) {
        this.config = config;
        this.storage = (0, storage_1.getDefaultStorage)();
        this.storageKey = config.storageKey ?? `smis-sso:${config.appKey}`;
        this.timeoutMs = config.timeoutMs ?? 60 * 60 * 1000;
        this.pollIntervalMs = config.pollIntervalMs ?? 60 * 1000;
        this.authOrigin = new URL(config.authBaseUrl).origin;
    }
    getCachedSession() {
        const session = (0, storage_1.readSession)(this.storage, this.storageKey);
        if (!session)
            return null;
        if (new Date(session.expiresAt).getTime() <= Date.now()) {
            (0, storage_1.storeSession)(this.storage, this.storageKey, null);
            return null;
        }
        return session;
    }
    async ensureSession() {
        const cached = this.getCachedSession();
        if (cached)
            return cached;
        if (typeof window === "undefined") {
            throw new Error("ensureSession requires a browser runtime to open the auth probe");
        }
        const session = await this.launchAuthProbe();
        (0, storage_1.storeSession)(this.storage, this.storageKey, session);
        return session;
    }
    async loadAuthorizations(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchAuthorizations)(this.config, resolvedSession);
    }
    async loadContextAuthorizations(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchContextAuthorizations)(this.config, resolvedSession);
    }
    /**
     * Clears the locally cached session only (no network calls).
     */
    clearSession() {
        (0, storage_1.storeSession)(this.storage, this.storageKey, null);
    }
    /**
     * Signs in, forcing a fresh probe if `force` is true even when a cached session exists.
     */
    async signIn(options) {
        const force = options?.force ?? false;
        if (force) {
            this.clearSession();
        }
        return this.ensureSession();
    }
    /**
     * Signs out: calls the auth portal logout (best-effort) and clears all local state.
     */
    async signOut(session) {
        const current = session ?? this.getCachedSession() ?? undefined;
        await (0, http_1.logoutSession)(this.config, current).catch(() => undefined);
        this.clearSession();
        // window.localStorage.removeItem(`smis-sso:${this.config.appKey}`);
        // window.cookieStore.delete(`smis_refresh_token`).catch(() => undefined);
    }
    /**
     * Switches user by clearing the current session and forcing a new sign-in.
     */
    async switchUser() {
        await this.signOut();
        return this.signIn({ force: true });
    }
    launchAuthProbe() {
        return new Promise((resolve, reject) => {
            const authUrl = (0, http_1.buildAuthUrl)(this.config);
            authUrl.searchParams.set("appKey", this.config.appKey);
            const popup = window.open(authUrl.toString(), "_blank", "width=580,height=640");
            if (!popup) {
                reject(new Error("Unable to open auth probe window"));
                return;
            }
            const timeoutId = window.setTimeout(() => {
                window.removeEventListener("message", messageHandler);
                popup.close();
                reject(new Error("Auth probe timed out"));
            }, this.timeoutMs);
            const messageHandler = (event) => {
                if (event.origin !== this.authOrigin)
                    return;
                if (!event.data || event.data.type !== "smis:sso:session")
                    return;
                window.clearTimeout(timeoutId);
                window.removeEventListener("message", messageHandler);
                popup.close();
                resolve(event.data.payload);
            };
            window.addEventListener("message", messageHandler);
            const intervalId = window.setInterval(() => {
                if (popup.closed) {
                    window.clearInterval(intervalId);
                    window.clearTimeout(timeoutId);
                    window.removeEventListener("message", messageHandler);
                    reject(new Error("Auth probe was closed before completing sign-in"));
                }
            }, this.pollIntervalMs);
        });
    }
}
exports.Client = Client;
const createAuthProbeResponse = (session) => {
    if (typeof window === "undefined")
        return;
    const message = {
        type: "smis:sso:session",
        payload: session,
    };
    window.opener?.postMessage(message, window.location.origin);
};
exports.createAuthProbeResponse = createAuthProbeResponse;
//# sourceMappingURL=client.js.map