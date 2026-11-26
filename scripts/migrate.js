require('dotenv').config();

const db = require('../config/database');

const rows = db.prepare(
    'SELECT version, name, applied_at FROM schema_migrations ORDER BY version'
).all();

console.table(rows);
db.close();
