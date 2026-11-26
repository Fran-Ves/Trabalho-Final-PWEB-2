const securityLog = require('../utils/securityLog');

function errorMiddleware(err, req, res, next) {

    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || err.statusCode || 500;
    let message = err.message;

    if (err.type === 'entity.parse.failed') {
        status = 400;
        message = 'JSON inválido no corpo da requisição';
    } else if (err.type === 'entity.too.large') {
        status = 413;
        message = 'Corpo da requisição muito grande';
    }

    if (status >= 500) {
        console.error(err.stack || err);
    }

    if (status === 403) {
        securityLog('ACCESS_DENIED', req);
    }

    return res.status(status).json({
        error: status >= 500
            ? 'Erro interno do servidor'
            : message
    });
}

module.exports = errorMiddleware;
