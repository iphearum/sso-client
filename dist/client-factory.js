"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCachedClient = void 0;
const caches = new Map();
const getCache = (scope) => {
    const existing = caches.get(scope);
    if (existing)
        return existing;
    const created = { byKey: new Map() };
    caches.set(scope, created);
    return created;
};
const stableConfigKey = (config) => {
    if (!config)
        return "{}";
    const sorted = Object.entries(config).sort(([a], [b]) => a.localeCompare(b));
    return JSON.stringify(Object.fromEntries(sorted));
};
const getCachedClient = (scope, provided, config, factory) => {
    if (provided) {
        const cache = getCache(scope);
        cache.last = provided;
        return provided;
    }
    const cache = getCache(scope);
    const key = stableConfigKey(config);
    const fromKey = cache.byKey.get(key);
    if (fromKey) {
        cache.last = fromKey;
        return fromKey;
    }
    if (!config && cache.last) {
        return cache.last;
    }
    const created = factory(config);
    cache.byKey.set(key, created);
    cache.last = created;
    return created;
};
exports.getCachedClient = getCachedClient;
//# sourceMappingURL=client-factory.js.map