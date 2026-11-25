const instance = require('../utils/instance');

// Adiciona o identificador da réplica na resposta (X-Instance-Id)
function instanceMiddleware(req, res, next) {
    res.setHeader('X-Instance-Id', instance);
    next();
}

module.exports = instanceMiddleware;
