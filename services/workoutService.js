const Workout = require('../models/Workout');
const Member = require('../models/Member');
const User = require('../models/User');

function createError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// O validator aceita camelCase e snake_case; aqui normaliza os dois
function pick(data, camel, snake) {
    return data[camel] !== undefined ? data[camel] : data[snake];
}

// Define quem é o treinador responsável pelo treino.
// - trainer: sempre ele mesmo (não pode atribuir o treino a outra pessoa)
// - admin: pode informar um treinador; se não informar, fica com o próprio admin
function resolveTrainerId(user, requestedTrainerId) {

    if (user.role === 'trainer') {
        if (requestedTrainerId !== undefined && requestedTrainerId !== user.id) {
            throw createError(
                'Treinadores só podem atribuir treinos a si mesmos',
                403
            );
        }

        return user.id;
    }

    const trainerId = requestedTrainerId !== undefined
        ? requestedTrainerId
        : user.id;

    const trainer = User.findById(trainerId);

    if (!trainer || !['trainer', 'admin'].includes(trainer.role)) {
        throw createError('Treinador não encontrado', 404);
    }

    return trainerId;
}

function assertMemberExists(memberId) {
    if (!Member.findById(memberId)) {
        throw createError('Membro não encontrado', 404);
    }
}

function create(user, data) {

    const memberId = pick(data, 'memberId', 'member_id');
    const trainerId = resolveTrainerId(
        user,
        pick(data, 'trainerId', 'trainer_id')
    );

    assertMemberExists(memberId);

    const workoutId = Workout.create(
        memberId,
        trainerId,
        data.name,
        data.description,
        data.exercises
    );

    return Workout.findById(workoutId);
}

function list() {
    return Workout.findAll();
}

function findById(user, id) {

    const workout = Workout.findById(id);

    if (!workout) {
        throw createError('Treino não encontrado', 404);
    }

    // Membro só pode consultar os próprios treinos
    if (user.role === 'member') {
        const member = Member.findByUserId(user.id);

        if (!member || member.id !== workout.member_id) {
            throw createError('Acesso negado', 403);
        }
    }

    return workout;
}

function update(user, id, data) {

    const workout = Workout.findById(id);

    if (!workout) {
        throw createError('Treino não encontrado', 404);
    }

    // Treinador só pode alterar os treinos pelos quais é responsável
    if (user.role === 'trainer' && workout.trainer_id !== user.id) {
        throw createError('Acesso negado', 403);
    }

    const requestedMemberId = pick(data, 'memberId', 'member_id');
    const requestedTrainerId = pick(data, 'trainerId', 'trainer_id');

    const memberId = requestedMemberId !== undefined
        ? requestedMemberId
        : workout.member_id;

    if (requestedMemberId !== undefined) {
        assertMemberExists(requestedMemberId);
    }

    const trainerId = requestedTrainerId !== undefined
        ? resolveTrainerId(user, requestedTrainerId)
        : workout.trainer_id;

    Workout.update(
        id,
        memberId,
        trainerId,
        data.name !== undefined ? data.name : workout.name,
        data.description !== undefined ? data.description : workout.description,
        data.exercises !== undefined ? data.exercises : workout.exercises
    );

    return Workout.findById(id);
}

function remove(id) {

    const deleted = Workout.delete(id);

    if (!deleted) {
        throw createError('Treino não encontrado', 404);
    }
}

module.exports = {
    create,
    list,
    findById,
    update,
    remove
};
