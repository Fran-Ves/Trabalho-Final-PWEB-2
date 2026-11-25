const securityLog = require('../utils/securityLog');

// Resposta de erro padronizada: { "error": "mensagem" }
// Detalhes internos (stack trace etc.) ficam só no log do servidor.
function errorMiddleware(err, req, res, next) {

    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || err.statusCode || 500;
    let message = err.message;

    // Erros do parser de JSON
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

    // Acesso negado a recurso de outro usuário (autorização por objeto)
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
