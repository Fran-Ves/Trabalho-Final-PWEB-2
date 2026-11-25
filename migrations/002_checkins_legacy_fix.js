// Ajusta bancos antigos cuja tabela checkins usava workout_id / checkin_time único.
// Em bancos novos não faz nada.

module.exports.up = (db) => {

    const columns = db.prepare('PRAGMA table_info(checkins)').all()
        .map(column => column.name);

    const needsFix =
        columns.length > 0 &&
        (!columns.includes('checkin_date') ||
         !columns.includes('checkin_time') ||
         columns.includes('workout_id'));

    if (!needsFix) return;

    db.exec(`
        CREATE TABLE checkins_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            checkin_date TEXT NOT NULL,
            checkin_time TEXT NOT NULL,

            FOREIGN KEY (member_id)
                REFERENCES members(id)
                ON DELETE CASCADE
        );

        INSERT INTO checkins_new (id, member_id, checkin_date, checkin_time)
        SELECT
            id,
            member_id,
            COALESCE(date(checkin_time), date('now', 'localtime')),
            COALESCE(time(checkin_time), time('now', 'localtime'))
        FROM checkins;

        DROP TABLE checkins;
        ALTER TABLE checkins_new RENAME TO checkins;
    `);
};
