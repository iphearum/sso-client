"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNextAuthSession = exports.signOut = exports.signIn = exports.SessionProvider = exports.useSession = exports.NextAuthClient = void 0;
/**
 * Next.js/App Router-friendly surface that mirrors `next-auth/react` while
 * keeping SMIS SSO in sync. This allows apps to swap imports to
 * `@smis/sso-client/next` with minimal code changes.
 */
const env_1 = require("./env");
const bootstrapRuntimeEnv = () => {
    const env = typeof process !== "undefined" ? process.env : undefined;
    if (!env)
        return;
    const keys = [
        "SMIS_APP_KEY",
        "NEXT_PUBLIC_SMIS_APP_KEY",
        "NEXTAUTH_SMIS_APP_KEY",
        "SMIS_AUTH_BASE_URL",
        "NEXT_PUBLIC_SMIS_AUTH_BASE_URL",
        "SMIS_PROBE_PATH",
        "NEXT_PUBLIC_SMIS_PROBE_PATH",
        "SMIS_STORAGE",
        "NEXT_PUBLIC_SMIS_STORAGE",
        "SMIS_STORAGE_KEY",
        "NEXT_PUBLIC_SMIS_STORAGE_KEY",
        "SMIS_TIMEOUT_MS",
        "NEXT_PUBLIC_SMIS_TIMEOUT_MS",
        "SMIS_POLL_INTERVAL_MS",
        "NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS",
    ];
    const inferred = {};
    let hasValue = false;
    for (const key of keys) {
        const value = env[key];
        if (typeof value === "string" && value.length > 0) {
            inferred[key] = value;
            hasValue = true;
        }
    }
    if (hasValue)
        (0, env_1.setRuntimeEnv)(inferred);
};
bootstrapRuntimeEnv();
var next_auth_1 = require("./next-auth");
Object.defineProperty(exports, "NextAuthClient", { enumerable: true, get: function () { return next_auth_1.NextAuthClient; } });
Object.defineProperty(exports, "useSession", { enumerable: true, get: function () { return next_auth_1.useSession; } });
// Keep NextAuth shared session state wiring available from the same import path.
var react_1 = require("next-auth/react");
Object.defineProperty(exports, "SessionProvider", { enumerable: true, get: function () { return react_1.SessionProvider; } });
// Re-export NextAuth helpers so consumers can swap the import path without
// refactoring their components.
var next_auth_2 = require("./next-auth");
Object.defineProperty(exports, "signIn", { enumerable: true, get: function () { return next_auth_2.signIn; } });
Object.defineProperty(exports, "signOut", { enumerable: true, get: function () { return next_auth_2.signOut; } });
Object.defineProperty(exports, "useNextAuthSession", { enumerable: true, get: function () { return next_auth_2.useSession; } });
//# sourceMappingURL=next.js.map