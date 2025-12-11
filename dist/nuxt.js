"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSession = useSession;
const app_1 = require("nuxt/app");
const client_1 = require("./client");
const client_factory_1 = require("./client-factory");
/**
 * Nuxt composable mirroring the Next.js drop-in API.
 * Usage: `const { data, status, ensureSession, signOut } = useSession()`
 * Import from `@smis/sso-client/nuxt`.
 */
function useSession(options) {
    const { client: providedClient, config, auto = true } = options ?? {};
    const client = providedClient ?? (0, client_factory_1.getCachedClient)("nuxt", undefined, config, (cfg) => new client_1.AuthClient(cfg));
    const data = (0, app_1.useState)("smis:sso:session", () => null);
    const status = (0, app_1.useState)("smis:sso:status", () => "loading");
    const ensureSession = async () => {
        if (status.value === "authenticated" && data.value) {
            return data.value;
        }
        status.value = "loading";
        try {
            const session = await client.ensureSession();
            data.value = session;
            status.value = "authenticated";
            return session;
        }
        catch (error) {
            console.error("SMIS session failed", error);
            data.value = null;
            status.value = "unauthenticated";
            return null;
        }
    };
    const signOut = async () => {
        await client.signOut();
        data.value = null;
        status.value = "unauthenticated";
    };
    if (auto && typeof window !== "undefined") {
        (0, app_1.onMounted)(() => {
            void ensureSession();
        });
    }
    return { data, status, ensureSession, signOut };
}
//# sourceMappingURL=nuxt.js.map