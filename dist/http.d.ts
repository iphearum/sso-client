import { Authorization, ContextAuthorization, Session } from "./types";
import type { ResolvedConfig } from "./config";
export declare const buildAuthUrl: (config: ResolvedConfig) => URL;
export declare const fetchAuthorizations: (config: ResolvedConfig, session: Session) => Promise<Authorization>;
export declare const fetchContextAuthorizations: (config: ResolvedConfig, session: Session) => Promise<ContextAuthorization>;
export declare const logoutSession: (config: ResolvedConfig, session?: Session) => Promise<void>;
