require('dotenv').config();

const bcrypt = require('bcryptjs');

const db = require('../config/database');
const User = require('../models/User');

async function createStaff() {

    const email = process.env.STAFF_EMAIL;
    const password = process.env.STAFF_PASSWORD;
    const role = process.env.STAFF_ROLE;

    if (!email || !password || !role) {
        console.error('Informe STAFF_EMAIL, STAFF_PASSWORD e STAFF_ROLE no .env');
        process.exitCode = 1;
        return;
    }

    if (!['admin', 'trainer'].includes(role)) {
        console.error('Papel inválido. Utilize admin ou trainer.');
        process.exitCode = 1;
        return;
    }

    if (password.length < 8) {
        console.error('A senha deve possuir pelo menos 8 caracteres.');
        process.exitCode = 1;
        return;
    }

    if (User.findByEmail(email)) {
        console.error('Este e-mail já está cadastrado.');
        process.exitCode = 1;
        return;
    }

    try {

        const passwordHash = await bcrypt.hash(password, 12);

        const userId = User.create(
            email,
            passwordHash,
            role
        );

        console.log('Usuário criado com sucesso!');
        console.log('ID:', userId);
        console.log('E-mail:', email);
        console.log('Papel:', role);

    } catch (error) {

        console.error('Erro ao criar usuário:', error.message);
        process.exitCode = 1;

    } finally {
        db.close();
    }
}

createStaff();