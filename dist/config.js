"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveConfig = void 0;
const env_1 = require("./env");
const inferAppKey = (config) => {
    const runtimeEnv = typeof globalThis !== "undefined" && globalThis.__SMIS_ENV__
        ? globalThis.__SMIS_ENV__
        : undefined;
    const globalAppKey = typeof globalThis !== "undefined"
        ? globalThis.__SMIS_APP_KEY__ ??
            globalThis.SMIS_APP_KEY ??
            globalThis.APP_KEY
        : undefined;
    return (config?.appKey ??
        (0, env_1.readEnvString)("SMIS_APP_KEY", "NEXT_PUBLIC_SMIS_APP_KEY", "NEXTAUTH_SMIS_APP_KEY") ??
        runtimeEnv?.NEXT_PUBLIC_SMIS_APP_KEY ??
        globalAppKey);
};
const inferAuthBaseUrl = (config) => config?.authBaseUrl ??
    (0, env_1.readEnvString)("SMIS_AUTH_BASE_URL", "NEXT_PUBLIC_SMIS_AUTH_BASE_URL") ??
    (typeof globalThis !== "undefined" ? globalThis.__SMIS_ENV__?.NEXT_PUBLIC_SMIS_AUTH_BASE_URL : undefined);
const inferProbePath = (config) => config?.probePath ??
    (0, env_1.readEnvString)("SMIS_PROBE_PATH", "NEXT_PUBLIC_SMIS_PROBE_PATH") ??
    (typeof globalThis !== "undefined" ? globalThis.__SMIS_ENV__?.NEXT_PUBLIC_SMIS_PROBE_PATH : undefined);
const inferStorage = (config) => {
    const env = (0, env_1.readEnvString)("SMIS_STORAGE", "NEXT_PUBLIC_SMIS_STORAGE");
    const preferred = config?.storage ?? env;
    if (preferred === "sessionStorage" || preferred === "memory")
        return preferred;
    return "localStorage";
};
const inferStorageKey = (config, appKey) => config?.storageKey ?? (0, env_1.readEnvString)("SMIS_STORAGE_KEY", "NEXT_PUBLIC_SMIS_STORAGE_KEY") ?? `smis-sso:${appKey}`;
const inferTimeout = (config) => config?.timeoutMs ?? (0, env_1.readEnvNumber)("SMIS_TIMEOUT_MS", "NEXT_PUBLIC_SMIS_TIMEOUT_MS");
const inferPollInterval = (config) => config?.pollIntervalMs ?? (0, env_1.readEnvNumber)("SMIS_POLL_INTERVAL_MS", "NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS");
const resolveConfig = (config) => {
    const appKey = inferAppKey(config);
    if (!appKey) {
        throw new Error("SMIS SSO: appKey is required. Provide config.appKey or set SMIS_APP_KEY / NEXT_PUBLIC_SMIS_APP_KEY / NEXTAUTH_SMIS_APP_KEY.");
    }
    const authBaseUrl = inferAuthBaseUrl(config) ?? "https://accounts.itc.edu.kh";
    const probePath = inferProbePath(config) ?? "/sso/probe";
    const storage = inferStorage(config) ?? "localStorage";
    const timeoutMs = inferTimeout(config) ?? 60 * 60 * 1000;
    const pollIntervalMs = inferPollInterval(config) ?? 60 * 1000;
    const storageKey = inferStorageKey(config, appKey);
    return {
        ...(config ?? {}),
        appKey,
        authBaseUrl,
        probePath,
        storage,
        storageKey,
        timeoutMs,
        pollIntervalMs,
    };
};
exports.resolveConfig = resolveConfig;
//# sourceMappingURL=config.js.map