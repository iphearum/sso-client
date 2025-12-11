"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthProbeResponse = exports.AuthClient = void 0;
const http_1 = require("./http");
const storage_1 = require("./storage");
const jwt_1 = require("./jwt");
const config_1 = require("./config");
class AuthClient {
    constructor(config = {}) {
        this.config = config;
        this.resolvedConfig = (0, config_1.resolveConfig)(config);
        this.storage = (0, storage_1.getDefaultStorage)(this.resolvedConfig.storage);
        this.storageKey = this.resolvedConfig.storageKey;
        this.timeoutMs = this.resolvedConfig.timeoutMs;
        this.pollIntervalMs = this.resolvedConfig.pollIntervalMs;
        this.authOrigin = new URL(this.resolvedConfig.authBaseUrl).origin;
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
        return (0, http_1.fetchAuthorizations)(this.resolvedConfig, resolvedSession);
    }
    async loadContextAuthorizations(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchContextAuthorizations)(this.resolvedConfig, resolvedSession);
    }
    /**
     * Returns user/token info and (optionally) contextual details such as employeeId/branches.
     * Set { fetchContext: true } to include contextual authorizations.
     */
    async user(options) {
        const fetchContext = options?.fetchContext ?? false;
        const session = options?.session ?? (await this.ensureSession());
        const info = this.decodeAccessToken(session.accessToken);
        if (!fetchContext)
            return info;
        const context = await this.loadContextAuthorizations(session);
        return { ...info, employeeId: context.employeeId, branches: context.branches };
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
        await (0, http_1.logoutSession)(this.resolvedConfig, current).catch(() => undefined);
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
            const authUrl = (0, http_1.buildAuthUrl)(this.resolvedConfig);
            (0, jwt_1.createAppProbeToken)(this.resolvedConfig.appKey)
                .then((token) => {
                authUrl.searchParams.set("token", token);
                openPopup(authUrl.toString());
            })
                .catch((error) => {
                reject(error);
            });
            const openPopup = (url) => {
                const popup = window.open(url, "_blank", "width=580,height=640");
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
            };
        });
    }
    decodeAccessToken(token) {
        const payload = (0, jwt_1.decodeJwtPayload)(token);
        return {
            userId: String(payload.sub ?? ''),
            username: String(payload.username ?? ''),
            // appKey: String(payload.appKey ?? this.resolvedConfig.appKey),
            roles: Array.isArray(payload.roles) ? payload.roles : [],
            permissions: Array.isArray(payload.permissions) ? payload.permissions : []
        };
    }
}
exports.AuthClient = AuthClient;
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