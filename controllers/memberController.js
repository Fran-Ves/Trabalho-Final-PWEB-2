const memberService = require('../services/memberService');

async function create(req, res, next) {
    try {

        const member = await memberService.create(req.body);

        return res.status(201).json({
            message: 'Membro cadastrado com sucesso',
            member
        });

    } catch (error) {
        next(error);
    }
}

function list(req, res, next) {
    try {

        const members = memberService.list();

        return res.status(200).json({
            total: members.length,
            members
        });

    } catch (error) {
        next(error);
    }
}

function findById(req, res, next) {
    try {

        const member = memberService.findById(
            Number(req.params.id)
        );

        return res.status(200).json({
            member
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    findById
};