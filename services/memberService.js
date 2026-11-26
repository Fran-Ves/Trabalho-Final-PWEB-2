const bcrypt = require('bcryptjs');

const db = require('../config/database');

const User = require('../models/User');
const Member = require('../models/Member');

async function create(data) {

    if (User.findByEmail(data.email)) {
        const error = new Error('E-mail já cadastrado');
        error.status = 409;
        throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const transaction = db.transaction(() => {

        const userId = User.create(
            data.email,
            passwordHash,
            'member'
        );

        const memberId = Member.create(
            userId,
            data.name,
            data.phone,
            data.birthDate
        );

        return memberId;
    });

    const memberId = transaction();

    return Member.findById(memberId);
}

function list() {
    return Member.findAll();
}

function findById(id) {

    const member = Member.findById(id);

    if (!member) {
        const error = new Error('Membro não encontrado');
        error.status = 404;
        throw error;
    }

    return member;
}

function findByUserId(userId) {

    const member = Member.findByUserId(userId);

    if (!member) {
        const error = new Error('Membro não encontrado para o usuário autenticado');
        error.status = 404;
        throw error;
    }

    return member;
}

module.exports = {
    create,
    list,
    findById,
    findByUserId
};