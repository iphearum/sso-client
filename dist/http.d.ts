import { Authorization, ContextAuthorization, Session, Config } from './types';
export declare const buildAuthUrl: (config: Config) => URL;
export declare const fetchAuthorizations: (config: Config, session: Session) => Promise<Authorization>;
export declare const fetchContextAuthorizations: (config: Config, session: Session) => Promise<ContextAuthorization>;
export declare const logoutSession: (config: Config, session?: Session) => Promise<void>;
