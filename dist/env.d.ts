export type EnvMap = Record<string, string | undefined>;
export declare const setRuntimeEnv: (env?: EnvMap) => void;
export declare const readEnvStringFrom: (env: EnvMap | undefined, ...keys: string[]) => string | undefined;
export declare const readEnvString: (...keys: string[]) => string | undefined;
export declare const readEnvNumberFrom: (env: EnvMap | undefined, ...keys: string[]) => number | undefined;
export declare const readEnvNumber: (...keys: string[]) => number | undefined;
