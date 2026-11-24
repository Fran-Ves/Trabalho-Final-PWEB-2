const db = require('../config/database');

class Checkin {

    static create(memberId, checkinDate, checkinTime) {
        const result = db.prepare(`
            INSERT INTO checkins (
                member_id,
                checkin_date,
                checkin_time
            )
            VALUES (?, ?, ?)
        `).run(memberId, checkinDate, checkinTime);

        return result.lastInsertRowid;
    }

    static findAll() {
        return db.prepare(`
            SELECT
                checkins.id,
                checkins.member_id,
                checkins.checkin_date,
                checkins.checkin_time,
                members.name AS member_name
            FROM checkins
            INNER JOIN members
                ON members.id = checkins.member_id
            ORDER BY checkins.checkin_date DESC, checkins.checkin_time DESC
        `).all();
    }

    static findByMemberId(memberId) {
        return db.prepare(`
            SELECT
                checkins.id,
                checkins.member_id,
                checkins.checkin_date,
                checkins.checkin_time,
                members.name AS member_name
            FROM checkins
            INNER JOIN members
                ON members.id = checkins.member_id
            WHERE checkins.member_id = ?
            ORDER BY checkins.checkin_date DESC, checkins.checkin_time DESC
        `).all(memberId);
    }

    static findById(id) {
        return db.prepare(`
            SELECT
                checkins.id,
                checkins.member_id,
                checkins.checkin_date,
                checkins.checkin_time,
                members.name AS member_name
            FROM checkins
            INNER JOIN members
                ON members.id = checkins.member_id
            WHERE checkins.id = ?
        `).get(id);
    }
}

module.exports = Checkin;
