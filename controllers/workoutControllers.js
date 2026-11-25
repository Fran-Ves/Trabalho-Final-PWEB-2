const workoutService = require('../services/workoutService');

function parseId(value) {
    const id = Number(value);

    if (!Number.isInteger(id) || id <= 0) {
        const error = new Error('ID de treino inválido');
        error.status = 400;
        throw error;
    }

    return id;
}

function create(req, res, next) {
    try {

        const workout = workoutService.create(req.user, req.body);

        return res.status(201).json({
            message: 'Treino cadastrado com sucesso',
            workout
        });

    } catch (error) {
        next(error);
    }
}

function list(req, res, next) {
    try {

        const { workouts, cacheHit } = workoutService.list();

        res.setHeader('X-Cache', cacheHit ? 'HIT' : 'MISS');

        return res.status(200).json({
            total: workouts.length,
            workouts
        });

    } catch (error) {
        next(error);
    }
}

function listMine(req, res, next) {
    try {

        const workouts = workoutService.listMine(req.user);

        return res.status(200).json({
            total: workouts.length,
            workouts
        });

    } catch (error) {
        next(error);
    }
}

function findById(req, res, next) {
    try {

        const workout = workoutService.findById(
            req.user,
            parseId(req.params.id)
        );

        return res.status(200).json({
            workout
        });

    } catch (error) {
        next(error);
    }
}

function update(req, res, next) {
    try {

        const workout = workoutService.update(
            req.user,
            parseId(req.params.id),
            req.body
        );

        return res.status(200).json({
            message: 'Treino atualizado com sucesso',
            workout
        });

    } catch (error) {
        next(error);
    }
}

function remove(req, res, next) {
    try {

        workoutService.remove(parseId(req.params.id));

        return res.status(200).json({
            message: 'Treino excluído com sucesso'
        });

    } catch (error) {
        next(error);
    }
}

module.exports = {
    create,
    list,
    listMine,
    findById,
    update,
    remove
};
