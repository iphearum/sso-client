"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readSession = exports.storeSession = exports.getDefaultStorage = exports.MemoryStorage = void 0;
class MemoryStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }
    setItem(key, value) {
        this.store.set(key, value);
    }
    removeItem(key) {
        this.store.delete(key);
    }
}
exports.MemoryStorage = MemoryStorage;
const getDefaultStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage;
    }
    return new MemoryStorage();
};
exports.getDefaultStorage = getDefaultStorage;
const storeSession = (storage, storageKey, session) => {
    if (!session) {
        storage.removeItem(storageKey);
        return;
    }
    storage.setItem(storageKey, JSON.stringify(session));
};
exports.storeSession = storeSession;
const readSession = (storage, storageKey) => {
    const value = storage.getItem(storageKey);
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch (error) {
        storage.removeItem(storageKey);
        return null;
    }
};
exports.readSession = readSession;
//# sourceMappingURL=storage.js.map