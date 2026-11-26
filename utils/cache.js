class TTLCache {

    constructor() {
        this.store = new Map();
    }

    get ttlMs() {
        const seconds = Number(process.env.CACHE_TTL_SECONDS ?? 30);
        return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
    }

    get(key) {
        const entry = this.store.get(key);

        if (!entry) return undefined;

        if (entry.expiresAt <= Date.now()) {
            this.store.delete(key);
            return undefined;
        }

        return entry.value;
    }

    set(key, value) {
        if (this.ttlMs === 0) return;

        this.store.set(key, {
            value,
            expiresAt: Date.now() + this.ttlMs
        });
    }

    delete(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }
}

module.exports = new TTLCache();
