const db = require('../config/database');

class Member {

    static create(userId, name, phone, birthDate) {
        const result = db.prepare(`
            INSERT INTO members (
                user_id,
                name,
                phone,
                birth_date
            )
            VALUES (?, ?, ?, ?)
        `).run(userId, name, phone || null, birthDate || null);

        return result.lastInsertRowid;
    }

    static findAll() {
        return db.prepare(`
            SELECT
                members.id,
                members.name,
                members.phone,
                members.birth_date,
                members.created_at,
                users.email
            FROM members
            INNER JOIN users
                ON members.user_id = users.id
            ORDER BY members.name
        `).all();
    }

    static findById(id) {
        return db.prepare(`
            SELECT
                members.id,
                members.name,
                members.phone,
                members.birth_date,
                members.created_at,
                users.email
            FROM members
            INNER JOIN users
                ON members.user_id = users.id
            WHERE members.id = ?
        `).get(id);
    }

    static findByUserId(userId) {
        return db.prepare(`
            SELECT
                members.id,
                members.name,
                members.phone,
                members.birth_date,
                members.created_at,
                users.email
            FROM members
            INNER JOIN users
                ON members.user_id = users.id
            WHERE members.user_id = ?
        `).get(userId);
    }

}

module.exports = Member;