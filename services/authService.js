const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const db = require('../config/database');
const User = require('../models/User');
const Member = require('../models/Member');

function generateToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            algorithm: 'HS256',
            expiresIn: '2h'
        }
    );
}

const DUMMY_HASH = bcrypt.hashSync('senha-falsa-para-igualar-tempo', 12);

async function register(data) {

    const existingUser = User.findByEmail(data.email);

    if (existingUser) {
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

        Member.create(
            userId,
            data.name,
            data.phone,
            data.birthDate
        );

        return userId;
    });

    const userId = transaction();

    const user = User.findById(userId);

    return {
        user,
        token: generateToken(user)
    };
}

async function login(data) {

    const user = User.findByEmail(data.email);

    if (!user) {
        await bcrypt.compare(data.password, DUMMY_HASH);

        const error = new Error('E-mail ou senha incorretos');
        error.status = 401;
        throw error;
    }

    const passwordMatch = await bcrypt.compare(
        data.password,
        user.password_hash
    );

    if (!passwordMatch) {
        const error = new Error('E-mail ou senha incorretos');
        error.status = 401;
        throw error;
    }

    const safeUser = User.findById(user.id);

    return {
        user: safeUser,
        token: generateToken(user)
    };
}

module.exports = {
    register,
    login
};