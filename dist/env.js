"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readEnvNumber = exports.readEnvNumberFrom = exports.readEnvString = exports.readEnvStringFrom = exports.setRuntimeEnv = void 0;
const hasProcessEnv = typeof process !== 'undefined' && !!process.env;
let runtimeEnv;
const getRuntimeEnv = () => {
    if (runtimeEnv)
        return runtimeEnv;
    if (typeof globalThis === "undefined")
        return undefined;
    const globalEnv = globalThis.__SMIS_ENV__ ?? globalThis.SMIS_ENV;
    return globalEnv && typeof globalEnv === "object" ? globalEnv : undefined;
};
const setRuntimeEnv = (env) => {
    runtimeEnv = env;
    if (typeof globalThis !== "undefined") {
        globalThis.__SMIS_ENV__ = env;
    }
};
exports.setRuntimeEnv = setRuntimeEnv;
const readEnv = (key, env) => {
    const direct = env?.[key];
    if (typeof direct === "string" && direct.length > 0)
        return direct;
    const runtime = getRuntimeEnv()?.[key];
    if (typeof runtime === "string" && runtime.length > 0)
        return runtime;
    if (!hasProcessEnv)
        return undefined;
    const value = process.env?.[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
};
const readEnvStringFrom = (env, ...keys) => {
    for (const key of keys) {
        const value = readEnv(key, env);
        if (value !== undefined)
            return value;
    }
    return undefined;
};
exports.readEnvStringFrom = readEnvStringFrom;
const readEnvString = (...keys) => (0, exports.readEnvStringFrom)(undefined, ...keys);
exports.readEnvString = readEnvString;
const readEnvNumberFrom = (env, ...keys) => {
    const raw = (0, exports.readEnvStringFrom)(env, ...keys);
    if (!raw)
        return undefined;
    const value = Number(raw);
    return Number.isFinite(value) ? value : undefined;
};
exports.readEnvNumberFrom = readEnvNumberFrom;
const readEnvNumber = (...keys) => (0, exports.readEnvNumberFrom)(undefined, ...keys);
exports.readEnvNumber = readEnvNumber;
//# sourceMappingURL=env.js.map