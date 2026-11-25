const instance = require('../utils/instance');

function loggerMiddleware(req, res, next) {

    const start = Date.now();

    res.on('finish', () => {

        const duration = Date.now() - start;
        const user = req.user ? `user=${req.user.id}(${req.user.role})` : 'anon';

        console.log(
            `[${new Date().toISOString()}] [${instance}] ` +
            `${req.method} ${req.originalUrl} | ` +
            `${res.statusCode} | ${duration}ms | ${req.ip} | ${user}`
        );
    });

    next();
}

module.exports = loggerMiddleware;
