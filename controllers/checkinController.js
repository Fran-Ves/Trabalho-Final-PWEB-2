const checkinService = require('../services/checkinService');
const Member = require('../models/Member');

function create(req, res, next) {
    try {
        const member = Member.findByUserId(req.user.id);

        if (!member) {
            const error = new Error('Membro não encontrado para o usuário autenticado');
            error.status = 404;
            throw error;
        }

        const checkin = checkinService.create(member.id, req.body);

        return res.status(201).json({
            message: 'Check-in realizado com sucesso',
            checkin
        });
    } catch (error) {
        next(error);
    }
}

function list(req, res, next) {
    try {
        const checkins = checkinService.list();

        return res.status(200).json({
            total: checkins.length,
            checkins
        });
    } catch (error) {
        next(error);
    }
}

function findByMemberId(req, res, next) {
    try {
        const memberId = Number(req.params.memberId);

        if (!Number.isInteger(memberId) || memberId <= 0) {
            const error = new Error('ID de membro inválido');
            error.status = 400;
            throw error;
        }

        if (req.user.role === 'member') {
            const member = Member.findByUserId(req.user.id);

            if (!member || member.id !== memberId) {
                const error = new Error('Acesso negado');
                error.status = 403;
                throw error;
            }
        }

        const checkins = checkinService.findByMemberId(memberId);

        return res.status(200).json({
            total: checkins.length,
            checkins
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    findByMemberId
};
