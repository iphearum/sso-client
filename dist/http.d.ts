import { SmisAuthorization, SmisSession, SmisSsoConfig } from './types';
export declare const buildAuthUrl: (config: SmisSsoConfig) => URL;
export declare const fetchAuthorizations: (config: SmisSsoConfig, session: SmisSession) => Promise<SmisAuthorization>;
export declare const fetchContextAuthorizations: (config: SmisSsoConfig, session: SmisSession) => Promise<unknown>;
export declare const logoutSession: (config: SmisSsoConfig, session?: SmisSession) => Promise<void>;
