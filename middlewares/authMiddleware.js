const jwt = require('jsonwebtoken');
const securityLog = require('../utils/securityLog');

function authMiddleware(req, res, next) {

    const authorization = req.headers.authorization;

    if (!authorization) {
        securityLog('AUTH_TOKEN_MISSING', req);

        return res.status(401).json({
            error: 'Token não informado'
        });
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
        securityLog('AUTH_TOKEN_MALFORMED', req);

        return res.status(401).json({
            error: 'Formato de token inválido'
        });
    }

    try {

        // Algoritmo fixo (allowlist): impede "alg: none" e confusão de algoritmos
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET,
            { algorithms: ['HS256'] }
        );

        req.user = {
            id: Number(decoded.sub),
            role: decoded.role
        };

        next();

    } catch (error) {

        securityLog('AUTH_TOKEN_INVALID', req);

        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });
    }
}

module.exports = authMiddleware;
