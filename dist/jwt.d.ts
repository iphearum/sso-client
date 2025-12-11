export declare const createHs256Jwt: (secret: string, payload: Record<string, unknown>, options?: {
    header?: Record<string, unknown>;
}) => Promise<string>;
export declare const verifyHs256Jwt: <T = any>(token: string, secret: string) => Promise<T>;
export declare const createAppProbeToken: (appKey: string, expiresInSeconds?: number) => Promise<string>;
export declare const decodeJwtPayload: <T = any>(token: string) => T;
