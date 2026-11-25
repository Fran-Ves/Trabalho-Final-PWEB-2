// Cache em memória com TTL (tempo de vida) e invalidação explícita.
// Estratégia: cache-aside. O service consulta o cache; se não houver (MISS),
// busca no banco e guarda. Qualquer escrita (POST/PUT/DELETE) invalida a chave.
//
// Limitação conhecida: cada réplica tem o seu próprio cache. Uma escrita numa
// réplica invalida apenas o cache dela; as demais ficam desatualizadas até o TTL
// expirar. Por isso o TTL é curto (padrão 30 s). Em produção real o ideal é Redis.

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
        // TTL 0 desativa o cache
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
