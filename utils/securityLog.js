const instance = require('./instance');

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
