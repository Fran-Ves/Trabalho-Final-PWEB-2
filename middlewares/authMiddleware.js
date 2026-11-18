const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {

    const authorization = req.headers.authorization;

    if (!authorization) {
        return res.status(401).json({
            error: 'Token não informado'
        });
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({
            error: 'Formato de token inválido'
        });
    }

    try {

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = {
            id: Number(decoded.sub),
            role: decoded.role
        };

        next();

    } catch (error) {

        return res.status(401).json({
            error: 'Token inválido ou expirado'
        });
    }
}

module.exports = authMiddleware;