require('dotenv').config();

const bcrypt = require('bcryptjs');

const db = require('../config/database');
const User = require('../models/User');
const Member = require('../models/Member');
const Workout = require('../models/Workout');

const PASSWORD = 'Academia@123';
const hash = bcrypt.hashSync(PASSWORD, 12);

function ensureUser(email, role) {
    const existing = User.findByEmail(email);
    return existing ? existing.id : User.create(email, hash, role);
}

const adminId = ensureUser('admin@academia.com', 'admin');
const trainerId = ensureUser('trainer@academia.com', 'trainer');
const memberUserId = ensureUser('aluno@academia.com', 'member');

let member = Member.findByUserId(memberUserId);

if (!member) {
    Member.create(memberUserId, 'Aluno Demonstração', '(89) 99999-0000', '2000-01-15');
    member = Member.findByUserId(memberUserId);
}

if (Workout.findByMemberId(member.id).length === 0) {
    Workout.create(
        member.id,
        trainerId,
        'Treino A - Peito e tríceps',
        'Foco em força, 3x por semana',
        'Supino reto 4x10\nSupino inclinado 3x12\nTríceps corda 3x15'
    );
}

console.log('Dados de demonstração prontos:');
console.log(`  admin    -> admin@academia.com   (id ${adminId})`);
console.log(`  trainer  -> trainer@academia.com (id ${trainerId})`);
console.log(`  member   -> aluno@academia.com   (id ${memberUserId})`);
console.log(`  senha    -> ${PASSWORD}`);

db.close();
