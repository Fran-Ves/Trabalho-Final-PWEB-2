function errorMiddleware(err, req, res, next) {

    console.error(err.stack || err);

    const status = err.status || 500;

    return res.status(status).json({
        error: status >= 500
            ? 'Erro interno do servidor'
            : err.message
    });
}

module.exports = errorMiddleware;