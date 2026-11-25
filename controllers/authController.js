const authService = require('../services/authService');
const securityLog = require('../utils/securityLog');

async function register(req, res, next) {
    try {

        const result = await authService.register(req.body);

        return res.status(201).json({
            message: 'Usuário cadastrado com sucesso',
            user: result.user,
            token: result.token
        });

    } catch (error) {
        next(error);
    }
}

async function login(req, res, next) {
    try {

        const result = await authService.login(req.body);

        securityLog('LOGIN_SUCCESS', req, { userId: result.user.id, role: result.user.role });

        return res.status(200).json({
            message: 'Login realizado com sucesso',
            user: result.user,
            token: result.token
        });

    } catch (error) {
        if (error.status === 401) {
            securityLog('LOGIN_FAILED', req, { email: req.body && req.body.email });
        }

        next(error);
    }
}

module.exports = {
    register,
    login
};