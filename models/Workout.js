const db = require('../config/database');

// Campos retornados nas consultas (com nome do membro e e-mail do treinador)
const SELECT_WORKOUT = `
    SELECT
        workouts.id,
        workouts.member_id,
        workouts.trainer_id,
        workouts.name,
        workouts.description,
        workouts.exercises,
        workouts.created_at,
        members.name AS member_name,
        users.email AS trainer_email
    FROM workouts
    LEFT JOIN members
        ON members.id = workouts.member_id
    LEFT JOIN users
        ON users.id = workouts.trainer_id
`;

class Workout {

    static create(memberId, trainerId, name, description, exercises) {
        const result = db.prepare(`
            INSERT INTO workouts (
                member_id,
                trainer_id,
                name,
                description,
                exercises
            )
            VALUES (?, ?, ?, ?, ?)
        `).run(
            memberId,
            trainerId,
            name,
            description ?? null,
            exercises ?? null
        );

        return result.lastInsertRowid;
    }

    static findAll() {
        return db.prepare(`
            ${SELECT_WORKOUT}
            ORDER BY workouts.created_at DESC, workouts.id DESC
        `).all();
    }

    static findById(id) {
        return db.prepare(`
            ${SELECT_WORKOUT}
            WHERE workouts.id = ?
        `).get(id);
    }

    static update(id, memberId, trainerId, name, description, exercises) {
        const result = db.prepare(`
            UPDATE workouts
            SET
                member_id = ?,
                trainer_id = ?,
                name = ?,
                description = ?,
                exercises = ?
            WHERE id = ?
        `).run(
            memberId,
            trainerId,
            name,
            description ?? null,
            exercises ?? null,
            id
        );

        return result.changes;
    }

    static delete(id) {
        const result = db.prepare(`
            DELETE FROM workouts
            WHERE id = ?
        `).run(id);

        return result.changes;
    }

}

module.exports = Workout;
