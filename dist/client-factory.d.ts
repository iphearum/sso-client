import type { Config } from "./types";
import { AuthClient } from "./client";
/**
 * Simple, adapter-friendly client cache.
 * - Reuses the last created client when no config is provided.
 * - Caches per serialized config so helpers and hooks share the same instance.
 */
type AnyClient = AuthClient;
export declare const getCachedClient: <T extends AnyClient>(scope: string, provided: T | undefined, config: Config | undefined, factory: (config?: Config) => T) => T;
export {};
