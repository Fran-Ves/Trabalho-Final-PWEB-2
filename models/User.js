const db = require('../config/database');

class User {

    static create(email, passwordHash, role = 'member') {
        const result = db.prepare(`
            INSERT INTO users (email, password_hash, role)
            VALUES (?, ?, ?)
        `).run(email, passwordHash, role);

        return result.lastInsertRowid;
    }

    static findByEmail(email) {
        return db.prepare(`
            SELECT * FROM users
            WHERE email = ?
        `).get(email);
    }

    static findById(id) {
        return db.prepare(`
            SELECT id, email, role, created_at
            FROM users
            WHERE id = ?
        `).get(id);
    }

}

module.exports = User;