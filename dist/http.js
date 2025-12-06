"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSession = exports.fetchContextAuthorizations = exports.fetchAuthorizations = exports.buildAuthUrl = void 0;
const buildAuthUrl = (config) => {
    const probePath = config.probePath ?? '/sso/probe';
    return new URL(probePath, config.authBaseUrl);
};
exports.buildAuthUrl = buildAuthUrl;
const fetchAuthorizations = async (config, session) => {
    const authUrl = new URL('/api/sso/authorizations', config.authBaseUrl);
    const fetchImpl = config.fetch ?? fetch;
    const response = await fetchImpl(authUrl.toString(), {
        headers: {
            Authorization: `Bearer ${session.accessToken}`,
            'X-SMIS-APP-KEY': config.appKey
        }
    });
    if (!response.ok) {
        throw new Error(`Failed to load authorizations (${response.status})`);
    }
    return (await response.json());
};
exports.fetchAuthorizations = fetchAuthorizations;
const fetchContextAuthorizations = async (config, session) => {
    const url = new URL('/api/sso/authorizations/context', config.authBaseUrl);
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
    const url = new URL('/auth/logout', config.authBaseUrl);
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