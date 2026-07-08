"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapRuntimeEnv = void 0;
const env_1 = require("./env");
const readNextRuntimeEnv = () => ({
    SMIS_APP_KEY: typeof process !== "undefined" ? process.env.SMIS_APP_KEY : undefined,
    NEXT_PUBLIC_SMIS_APP_KEY: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_APP_KEY : undefined,
    NEXTAUTH_SMIS_APP_KEY: typeof process !== "undefined" ? process.env.NEXTAUTH_SMIS_APP_KEY : undefined,
    SMIS_AUTH_BASE_URL: typeof process !== "undefined" ? process.env.SMIS_AUTH_BASE_URL : undefined,
    NEXT_PUBLIC_SMIS_AUTH_BASE_URL: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_AUTH_BASE_URL : undefined,
    SMIS_PROBE_PATH: typeof process !== "undefined" ? process.env.SMIS_PROBE_PATH : undefined,
    NEXT_PUBLIC_SMIS_PROBE_PATH: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_PROBE_PATH : undefined,
    SMIS_STORAGE: typeof process !== "undefined" ? process.env.SMIS_STORAGE : undefined,
    NEXT_PUBLIC_SMIS_STORAGE: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_STORAGE : undefined,
    SMIS_STORAGE_KEY: typeof process !== "undefined" ? process.env.SMIS_STORAGE_KEY : undefined,
    NEXT_PUBLIC_SMIS_STORAGE_KEY: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_STORAGE_KEY : undefined,
    SMIS_TIMEOUT_MS: typeof process !== "undefined" ? process.env.SMIS_TIMEOUT_MS : undefined,
    NEXT_PUBLIC_SMIS_TIMEOUT_MS: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_TIMEOUT_MS : undefined,
    SMIS_POLL_INTERVAL_MS: typeof process !== "undefined" ? process.env.SMIS_POLL_INTERVAL_MS : undefined,
    NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS: typeof process !== "undefined" ? process.env.NEXT_PUBLIC_SMIS_POLL_INTERVAL_MS : undefined,
});
const bootstrapRuntimeEnv = () => {
    if (typeof process === "undefined")
        return;
    const inferred = readNextRuntimeEnv();
    for (const value of Object.values(inferred)) {
        if (typeof value === "string" && value.length > 0) {
            (0, env_1.setRuntimeEnv)(inferred);
            return;
        }
    }
};
exports.bootstrapRuntimeEnv = bootstrapRuntimeEnv;
//# sourceMappingURL=runtime-bootstrap.js.map