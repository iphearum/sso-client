import { Session, StorageAdapter } from './types';
export declare class MemoryStorage implements StorageAdapter {
    private store;
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export declare const getDefaultStorage: (preferred?: "localStorage" | "sessionStorage" | "memory") => StorageAdapter;
export declare const storeSession: (storage: StorageAdapter, storageKey: string, session: Session | null) => void;
export declare const readSession: (storage: StorageAdapter, storageKey: string) => Session | null;
