module.exports.up = (db) => {
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_workouts_member_id
            ON workouts(member_id);

        CREATE INDEX IF NOT EXISTS idx_workouts_trainer_id
            ON workouts(trainer_id);

        CREATE INDEX IF NOT EXISTS idx_checkins_member_id
            ON checkins(member_id);

        CREATE INDEX IF NOT EXISTS idx_checkins_date
            ON checkins(checkin_date DESC, checkin_time DESC);
    `);
};
