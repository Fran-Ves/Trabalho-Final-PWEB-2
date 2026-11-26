const instance = require('../utils/instance');

function instanceMiddleware(req, res, next) {
    res.setHeader('X-Instance-Id', instance);
    next();
}

module.exports = instanceMiddleware;
