import { SmisSession, StorageAdapter } from './types';
export declare class MemoryStorage implements StorageAdapter {
    private store;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const getDefaultStorage: () => StorageAdapter;
export declare const storeSession: (storage: StorageAdapter, storageKey: string, session: SmisSession | null) => void;
export declare const readSession: (storage: StorageAdapter, storageKey: string) => SmisSession | null;
