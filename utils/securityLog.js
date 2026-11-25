const instance = require('./instance');

// Registra eventos de segurança em JSON (uma linha por evento), com
// quando / onde / quem / o quê. Nunca registra senhas nem tokens.
function securityLog(event, req, details = {}) {

    const entry = {
        timestamp: new Date().toISOString(),
        type: 'security',
        event,
        instance,
        ip: req.ip,
        userId: req.user ? req.user.id : null,
        role: req.user ? req.user.role : null,
        method: req.method,
        path: req.originalUrl,
        ...details
    };

    console.warn(JSON.stringify(entry));
}

module.exports = securityLog;
