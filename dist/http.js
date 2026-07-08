"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAppSessions = exports.revokeServiceSession = exports.fetchServiceSessionGroups = exports.fetchServiceSessions = exports.logoutSession = exports.fetchContextAuthorizations = exports.fetchAuthorizations = exports.refreshSessionRequest = exports.fetchSignInProviders = exports.buildProviderStartUrl = exports.buildAuthUrl = void 0;
const buildAuthUrl = (config) => new URL(config.probePath, config.authBaseUrl);
exports.buildAuthUrl = buildAuthUrl;
/** URL that starts an OIDC/social sign-in (e.g. Google) for the configured app. */
const buildProviderStartUrl = (config, providerKey, options) => {
    const url = new URL(`/auth/oidc/${encodeURIComponent(providerKey)}/start`, config.authBaseUrl);
    url.searchParams.set("appKey", config.appKey);
    if (options?.intent)
        url.searchParams.set("intent", options.intent);
    return url;
};
exports.buildProviderStartUrl = buildProviderStartUrl;
/** Fetches the sign-in options configured for the app, with URLs made absolute. */
const fetchSignInProviders = async (config) => {
    const url = new URL("/api/sso/providers", config.authBaseUrl);
    url.searchParams.set("appKey", config.appKey);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(url.toString());
    if (!response.ok) {
        throw new Error(`Failed to load sign-in providers (${response.status})`);
    }
    const body = (await response.json());
    return (body.providers ?? []).map((provider) => ({
        ...provider,
        startUrl: new URL(provider.startUrl, config.authBaseUrl).toString(),
        iconUrl: provider.iconUrl ? new URL(provider.iconUrl, config.authBaseUrl).toString() : null,
    }));
};
exports.fetchSignInProviders = fetchSignInProviders;
/**
 * Exchanges a refresh token for a fresh session without user interaction.
 * Throws when the token is expired/revoked or the app now requires consent.
 */
const refreshSessionRequest = async (config, refreshToken) => {
    const url = new URL("/auth/refresh", config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken, appKey: config.appKey }),
    });
    const body = (await response.json().catch(() => ({})));
    if (response.status === 202 || body?.requiresConsent) {
        throw new Error("Session refresh requires consent; sign in interactively");
    }
    if (!response.ok) {
        throw new Error(`Failed to refresh session (${response.status})`);
    }
    return body;
};
exports.refreshSessionRequest = refreshSessionRequest;
const fetchAuthorizations = async (config, session) => {
    const authUrl = new URL("/api/sso/authorizations", config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(authUrl.toString(), {
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            "X-SMIS-APP-KEY": config.appKey,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to load authorizations (${response.status})`);
    }
    return (await response.json());
};
exports.fetchAuthorizations = fetchAuthorizations;
const fetchContextAuthorizations = async (config, session) => {
    const url = new URL("/api/sso/authorizations/context", config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(url.toString(), {
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Failed to load contextual authorizations (${response.status})`);
    }
    return (await response.json());
};
exports.fetchContextAuthorizations = fetchContextAuthorizations;
const logoutSession = async (config, session) => {
    if (!session?.refreshToken)
        return;
    const url = new URL("/auth/logout", config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    try {
        await fetchImpl(url.toString(), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: session.refreshToken }),
        });
    }
    catch (error) {
        // Swallow network errors; signOut should still proceed locally.
    }
};
exports.logoutSession = logoutSession;
const getAuthorizedJson = async (config, session, path, init) => {
    const url = new URL(path, config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(url.toString(), {
        ...init,
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            ...(init?.headers ?? {})
        }
    });
    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }
    return (await response.json());
};
const fetchServiceSessions = async (config, session) => getAuthorizedJson(config, session, "/api/sessions");
exports.fetchServiceSessions = fetchServiceSessions;
const fetchServiceSessionGroups = async (config, session) => getAuthorizedJson(config, session, "/api/sessions/services");
exports.fetchServiceSessionGroups = fetchServiceSessionGroups;
const revokeServiceSession = async (config, session, serviceSessionId) => {
    await getAuthorizedJson(config, session, `/api/sessions/${encodeURIComponent(serviceSessionId)}`, {
        method: "DELETE"
    });
};
exports.revokeServiceSession = revokeServiceSession;
const revokeAppSessions = async (config, session, appKey) => {
    await getAuthorizedJson(config, session, `/api/sessions/apps/${encodeURIComponent(appKey)}`, {
        method: "DELETE"
    });
};
exports.revokeAppSessions = revokeAppSessions;
//# sourceMappingURL=http.js.map