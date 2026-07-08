import { Authorization, ContextAuthorization, ServiceSessionGroup, ServiceSessionInfo, Session, SignInProvider } from "./types";
import type { ResolvedConfig } from "./config";
export declare const buildAuthUrl: (config: ResolvedConfig) => URL;
/** URL that starts an OIDC/social sign-in (e.g. Google) for the configured app. */
export declare const buildProviderStartUrl: (config: ResolvedConfig, providerKey: string, options?: {
    intent?: "link";
}) => URL;
/** Fetches the sign-in options configured for the app, with URLs made absolute. */
export declare const fetchSignInProviders: (config: ResolvedConfig) => Promise<SignInProvider[]>;
/**
 * Exchanges a refresh token for a fresh session without user interaction.
 * Throws when the token is expired/revoked or the app now requires consent.
 */
export declare const refreshSessionRequest: (config: ResolvedConfig, refreshToken: string) => Promise<Session>;
export declare const fetchAuthorizations: (config: ResolvedConfig, session: Session) => Promise<Authorization>;
export declare const fetchContextAuthorizations: (config: ResolvedConfig, session: Session) => Promise<ContextAuthorization>;
export declare const logoutSession: (config: ResolvedConfig, session?: Session) => Promise<void>;
export declare const fetchServiceSessions: (config: ResolvedConfig, session: Session) => Promise<ServiceSessionInfo[]>;
export declare const fetchServiceSessionGroups: (config: ResolvedConfig, session: Session) => Promise<ServiceSessionGroup[]>;
export declare const revokeServiceSession: (config: ResolvedConfig, session: Session, serviceSessionId: string) => Promise<void>;
export declare const revokeAppSessions: (config: ResolvedConfig, session: Session, appKey: string) => Promise<void>;
