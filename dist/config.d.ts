import type { Config } from "./types";
export type StorageKind = "localStorage" | "sessionStorage" | "memory";
export interface ResolvedConfig extends Config {
    appKey: string;
    authBaseUrl: string;
    probePath: string;
    storage: StorageKind;
    storageKey: string;
    timeoutMs: number;
    pollIntervalMs: number;
}
export declare const resolveConfig: (config?: Config) => ResolvedConfig;
