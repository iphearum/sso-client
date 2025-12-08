"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSession = exports.fetchContextAuthorizations = exports.fetchAuthorizations = exports.buildAuthUrl = void 0;
const requireBaseUrl = (config) => {
    if (!config.authBaseUrl) {
        throw new Error('authBaseUrl is required on config');
    }
    return config.authBaseUrl;
};
const requireAppKey = (config) => {
    if (!config.appKey) {
        throw new Error('appKey is required on config');
    }
    return config.appKey;
};
const buildAuthUrl = (config) => {
    const probePath = config.probePath ?? '/sso/probe';
    return new URL(probePath, requireBaseUrl(config));
};
exports.buildAuthUrl = buildAuthUrl;
const fetchAuthorizations = async (config, session) => {
    const authUrl = new URL('/api/sso/authorizations', requireBaseUrl(config));
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(authUrl.toString(), {
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'X-SMIS-APP-KEY': requireAppKey(config)
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to load authorizations (${response.status})`);
    }
    return (await response.json());
};
exports.fetchAuthorizations = fetchAuthorizations;
const fetchContextAuthorizations = async (config, session) => {
    const url = new URL('/api/sso/authorizations/context', requireBaseUrl(config));
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(url.toString(), {
        headers: {
            Authorization: `Bearer ${session.accessToken}`
        }
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
    const url = new URL('/auth/logout', requireBaseUrl(config));
    const fetchImpl = config.fetch ?? fetch;
    try {
        await fetchImpl(url.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: session.refreshToken })
        });
    }
    catch (error) {
        // Swallow network errors; signOut should still proceed locally.
    }
};
exports.logoutSession = logoutSession;
//# sourceMappingURL=http.js.map