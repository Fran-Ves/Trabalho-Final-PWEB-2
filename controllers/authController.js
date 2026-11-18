const authService = require('../services/authService');

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

        return res.status(200).json({
            message: 'Login realizado com sucesso',
            user: result.user,
            token: result.token
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    register,
    login
};