const rateLimit = require('express-rate-limit');
const securityLog = require('../utils/securityLog');

function envNumber(name, fallback) {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function handler(req, res) {
    securityLog('RATE_LIMIT_EXCEEDED', req);

    return res.status(429).json({
        error: 'Muitas requisições. Tente novamente em instantes.'
    });
}

// Limite geral da API (por IP)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: envNumber('RATE_LIMIT_MAX', 300),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler
});

// Limite rígido para login/cadastro: reduz força bruta e credential stuffing.
// Só conta tentativas que falharam (skipSuccessfulRequests).
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: envNumber('AUTH_RATE_LIMIT_MAX', 10),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    handler
});

module.exports = { apiLimiter, authLimiter };
