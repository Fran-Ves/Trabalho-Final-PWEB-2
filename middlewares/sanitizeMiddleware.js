const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const HTML_TAGS = /<\/?[a-zA-Z][^>]*>/g;
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const UNTOUCHED_KEYS = new Set(['password']);
const MAX_DEPTH = 5;

function clean(value, key, depth) {

    if (depth > MAX_DEPTH) {
        const error = new Error('Estrutura JSON muito profunda');
        error.status = 400;
        throw error;
    }

    if (typeof value === 'string') {
        if (UNTOUCHED_KEYS.has(key)) return value;

        return value
            .normalize('NFC')
            .replace(CONTROL_CHARS, '')
            .replace(HTML_TAGS, '')
            .trim();
    }

    if (Array.isArray(value)) {
        return value.map(item => clean(item, key, depth + 1));
    }

    if (value && typeof value === 'object') {
        const result = {};

        for (const [childKey, childValue] of Object.entries(value)) {
            if (FORBIDDEN_KEYS.has(childKey)) continue;
            result[childKey] = clean(childValue, childKey, depth + 1);
        }

        return result;
    }

    return value;
}

function sanitizeMiddleware(req, res, next) {
    try {
        req.body = clean(req.body ?? {}, null, 0);
        next();
    } catch (error) {
        next(error);
    }
}

module.exports = sanitizeMiddleware;
