"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAuthClient = void 0;
exports.signIn = signIn;
exports.signOut = signOut;
exports.useSession = useSession;
const react_1 = require("react");
const react_2 = require("next-auth/react");
const client_1 = require("./client");
const client_factory_1 = require("./client-factory");
const config_1 = require("./config");
/**
 * Thin wrapper around AuthClient that knows how to hydrate NextAuth's session.
 */
class NextAuthClient extends client_1.AuthClient {
    async ensureNextAuthSession(adapter, options) {
        const { sessionHook, signIn } = adapter;
        const providerId = options?.providerId ?? "credentials";
        const redirect = options?.redirect ?? false;
        const session = options?.session ?? (await this.ensureSession());
        const alreadySynced = sessionHook.status === "authenticated" &&
            Boolean(sessionHook.data?.sso?.accessToken === session.accessToken);
        if (alreadySynced || sessionHook.status === "loading") {
            return session;
        }
        await signIn(providerId, {
            token: session.accessToken,
            session: JSON.stringify(session),
            redirect,
            ...(options?.payload ?? {}),
        });
        return session;
    }
}
exports.NextAuthClient = NextAuthClient;
// --- Helpers ---------------------------------------------------------------
const getClient = (client, config) => (0, client_factory_1.getCachedClient)("next-auth", client, config, (cfg) => new NextAuthClient((0, config_1.resolveConfig)(cfg)));
// --- Public surface --------------------------------------------------------
async function signIn(options) {
    const { client, config, force, ...hydrateOptions } = options ?? {};
    const resolvedSession = hydrateOptions.session ?? (await getClient(client, config).signIn({ force }));
    const providerId = hydrateOptions.providerId ?? "credentials";
    const redirect = hydrateOptions.redirect ?? false;
    await (0, react_2.signIn)(providerId, {
        token: resolvedSession.accessToken,
        session: JSON.stringify(resolvedSession),
        redirect,
        ...(hydrateOptions.payload ?? {}),
    });
    return resolvedSession;
}
async function signOut(options) {
    const { client, config, ...nextAuthOptions } = options ?? {};
    await getClient(client, config).signOut().catch(() => undefined);
    await (0, react_2.signOut)(nextAuthOptions);
}
/**
 * Drop-in replacement for NextAuth's `useSession` that stays in sync with SMIS SSO.
 */
function useSession(options) {
    const sessionHook = (0, react_2.useSession)();
    const { client: providedClient, config, ...ensureOptions } = options ?? {};
    // Memoize inputs to avoid effect loops when callers pass inline objects.
    const configKey = (0, react_1.useMemo)(() => JSON.stringify(config ?? {}), [config]);
    const ensureKey = (0, react_1.useMemo)(() => JSON.stringify(ensureOptions ?? {}), [ensureOptions]);
    const client = (0, react_1.useMemo)(() => {
        try {
            return getClient(providedClient, config);
        }
        catch (error) {
            // Surface the configuration issue but let the app keep rendering.
            console.error("SMIS SSO: client initialization failed", error);
            return null;
        }
    }, [providedClient, config, configKey]);
    const memoizedEnsureOptions = (0, react_1.useMemo)(() => ensureOptions, [ensureKey]);
    (0, react_1.useEffect)(() => {
        if (!client)
            return;
        if (sessionHook.status === "loading")
            return;
        void client.ensureNextAuthSession({ sessionHook, signIn: react_2.signIn }, memoizedEnsureOptions);
    }, [client, sessionHook.status, memoizedEnsureOptions]);
    return sessionHook;
}
//# sourceMappingURL=next-auth.js.map