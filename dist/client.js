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
        // Expired-but-present session: try a silent refresh before falling back
        // to the interactive probe.
        const stale = (0, storage_1.readSession)(this.storage, this.storageKey);
        if (stale?.refreshToken) {
            const refreshed = await this.refreshSession(stale.refreshToken).catch(() => null);
            if (refreshed)
                return refreshed;
        }
        if (typeof window === "undefined") {
            throw new Error("ensureSession requires a browser runtime to open the auth probe");
        }
        const session = await this.launchAuthProbe();
        (0, storage_1.storeSession)(this.storage, this.storageKey, session);
        return session;
    }
    /**
     * Exchanges the refresh token (given or cached) for a fresh session with no
     * user interaction. Returns null when no refresh token is available or the
     * gateway rejects it (revoked/expired/consent required).
     */
    async refreshSession(refreshToken) {
        const token = refreshToken ?? (0, storage_1.readSession)(this.storage, this.storageKey)?.refreshToken;
        if (!token)
            return null;
        try {
            const session = await (0, http_1.refreshSessionRequest)(this.resolvedConfig, token);
            (0, storage_1.storeSession)(this.storage, this.storageKey, session);
            return session;
        }
        catch (error) {
            if (!refreshToken)
                this.clearSession();
            return null;
        }
    }
    async loadAuthorizations(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchAuthorizations)(this.resolvedConfig, resolvedSession);
    }
    async loadContextAuthorizations(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchContextAuthorizations)(this.resolvedConfig, resolvedSession);
    }
    async listSessions(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchServiceSessions)(this.resolvedConfig, resolvedSession);
    }
    async listSessionServices(session) {
        const resolvedSession = session ?? (await this.ensureSession());
        return (0, http_1.fetchServiceSessionGroups)(this.resolvedConfig, resolvedSession);
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
        const prompt = options?.prompt;
        if (force) {
            this.clearSession();
        }
        if (prompt === 'select_account') {
            if (typeof window === 'undefined') {
                throw new Error('signIn with prompt=select_account requires a browser runtime');
            }
            const session = await this.launchAuthProbe({ prompt });
            (0, storage_1.storeSession)(this.storage, this.storageKey, session);
            return session;
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
        return this.signIn({ force: true, prompt: 'select_account' });
    }
    /**
     * Signs in through a linked OIDC/social provider (e.g. 'google'), skipping
     * the password form: the popup goes straight to the identity provider and
     * resolves with the SMIS session once the gateway completes the callback.
     * The provider must be listed in the app's linked providers on the gateway.
     */
    async signInWithProvider(providerKey, options) {
        if (typeof window === "undefined") {
            throw new Error("signInWithProvider requires a browser runtime");
        }
        if (!(options?.force ?? false)) {
            const cached = this.getCachedSession();
            if (cached)
                return cached;
        }
        const session = await this.launchAuthProbe({
            startUrl: (0, http_1.buildProviderStartUrl)(this.resolvedConfig, providerKey)
        });
        (0, storage_1.storeSession)(this.storage, this.storageKey, session);
        return session;
    }
    /**
     * Lists the sign-in options configured for this app on the gateway
     * (password-replacing primary provider and/or social buttons), so UIs can
     * render provider buttons dynamically instead of hard-coding them.
     */
    async listSignInProviders() {
        return (0, http_1.fetchSignInProviders)(this.resolvedConfig);
    }
    /**
     * Full-page redirect sign-in for environments where popups don't work
     * (in-app webviews, popup blockers, COOP-isolated pages). Navigates away to
     * the auth portal; on return, call `handleRedirectCallback()` to pick up the
     * session from the URL. Pass `providerKey` to go straight to a social IdP.
     */
    signInWithRedirect(options) {
        if (typeof window === "undefined") {
            throw new Error("signInWithRedirect requires a browser runtime");
        }
        const returnTo = options?.redirectUri ?? this.currentUrlWithoutTokens();
        const target = options?.providerKey
            ? (0, http_1.buildProviderStartUrl)(this.resolvedConfig, options.providerKey)
            : (0, http_1.buildAuthUrl)(this.resolvedConfig);
        target.searchParams.set("appKey", this.resolvedConfig.appKey);
        target.searchParams.set("redirect_uri", returnTo);
        if (options?.prompt)
            target.searchParams.set("prompt", options.prompt);
        window.location.assign(target.toString());
    }
    /**
     * Completes a redirect sign-in: reads the session from the current URL's
     * query string (accessToken/refreshToken/expiresAt), stores it, scrubs the
     * tokens from the address bar, and returns it. Returns null when the URL
     * carries no session (safe to call unconditionally on page load).
     */
    handleRedirectCallback(options) {
        if (typeof window === "undefined" && !options?.url)
            return null;
        const href = options?.url ?? window.location.href;
        const url = new URL(href);
        const accessToken = url.searchParams.get("accessToken");
        const refreshToken = url.searchParams.get("refreshToken");
        const expiresAt = url.searchParams.get("expiresAt");
        if (!accessToken || !expiresAt)
            return null;
        const session = {
            accessToken,
            refreshToken: refreshToken ?? undefined,
            appKey: this.resolvedConfig.appKey,
            expiresAt
        };
        (0, storage_1.storeSession)(this.storage, this.storageKey, session);
        if ((options?.replaceHistory ?? true) && typeof window !== "undefined" && !options?.url) {
            url.searchParams.delete("accessToken");
            url.searchParams.delete("refreshToken");
            url.searchParams.delete("expiresAt");
            window.history.replaceState(window.history.state, "", url.toString());
        }
        return session;
    }
    currentUrlWithoutTokens() {
        const url = new URL(window.location.href);
        url.searchParams.delete("accessToken");
        url.searchParams.delete("refreshToken");
        url.searchParams.delete("expiresAt");
        return url.toString();
    }
    /**
     * Links an external provider account (e.g. a Google account) to the user
     * currently signed in at the auth portal, so both sign-in methods resolve
     * to the same SMIS account even when their emails differ. Requires an
     * active identity session at the gateway (i.e. the user signed in via the
     * popup at least once in this browser). Resolves with the link outcome;
     * inspect `result.linked` / `result.error`.
     */
    async linkProvider(providerKey) {
        if (typeof window === "undefined") {
            throw new Error("linkProvider requires a browser runtime");
        }
        return this.launchAuthProbe({
            startUrl: (0, http_1.buildProviderStartUrl)(this.resolvedConfig, providerKey, { intent: "link" }),
            expect: "smis:sso:link"
        });
    }
    async revokeSession(serviceSessionId, session) {
        const current = session ?? (await this.ensureSession());
        await (0, http_1.revokeServiceSession)(this.resolvedConfig, current, serviceSessionId);
        if (current.refreshToken === serviceSessionId || current.serviceSessionId === serviceSessionId) {
            this.clearSession();
        }
    }
    async revokeCurrentAppSessions(session) {
        const current = session ?? (await this.ensureSession());
        await (0, http_1.revokeAppSessions)(this.resolvedConfig, current, this.resolvedConfig.appKey);
        this.clearSession();
    }
    launchAuthProbe(options) {
        return new Promise((resolve, reject) => {
            const authUrl = options?.startUrl ?? (0, http_1.buildAuthUrl)(this.resolvedConfig);
            authUrl.searchParams.set("appKey", this.resolvedConfig.appKey);
            if (options?.prompt) {
                authUrl.searchParams.set('prompt', options.prompt);
            }
            let settled = false;
            let timeoutId;
            let intervalId;
            let popup = null;
            const cleanup = () => {
                if (timeoutId !== undefined) {
                    window.clearTimeout(timeoutId);
                }
                if (intervalId !== undefined) {
                    window.clearInterval(intervalId);
                }
                window.removeEventListener("message", messageHandler);
            };
            const fail = (error) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                popup?.close();
                reject(error);
            };
            const complete = (payload) => {
                if (settled)
                    return;
                settled = true;
                cleanup();
                popup?.close();
                resolve(payload);
            };
            const expectedType = options?.expect ?? "smis:sso:session";
            const messageHandler = (event) => {
                if (event.origin !== this.authOrigin)
                    return;
                if (!event.data || event.data.type !== expectedType)
                    return;
                complete(event.data.payload);
            };
            popup = window.open("about:blank", "_blank", "width=580,height=640");
            if (!popup) {
                fail(new Error("Unable to open auth probe window"));
                return;
            }
            const openedPopup = popup;
            (0, jwt_1.createAppProbeToken)(this.resolvedConfig.appKey)
                .then((token) => {
                authUrl.searchParams.set("token", token);
            })
                .catch((error) => {
                // Fall back to appKey-only probe when Web Crypto isn't available.
                console.warn("SMIS SSO: app token signing unavailable, falling back to appKey probe.", error);
            })
                .finally(() => {
                try {
                    openedPopup.location.href = authUrl.toString();
                }
                catch (error) {
                    fail(new Error("Unable to open auth probe window"));
                }
            });
            timeoutId = window.setTimeout(() => {
                fail(new Error("Auth probe timed out"));
            }, this.timeoutMs);
            window.addEventListener("message", messageHandler);
            intervalId = window.setInterval(() => {
                if (openedPopup.closed) {
                    fail(new Error("Auth probe was closed before completing sign-in"));
                }
            }, this.pollIntervalMs);
        });
    }
    decodeAccessToken(token) {
        const payload = (0, jwt_1.decodeJwtPayload)(token);
        return {
            userId: String(payload.sub ?? ''),
            username: String(payload.username ?? ''),
            email: payload.email ? String(payload.email) : undefined,
            name: payload.name ? String(payload.name) : undefined,
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