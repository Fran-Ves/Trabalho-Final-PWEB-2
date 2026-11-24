const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Diretório do banco de dados pra deixar ele separado do resto do projeto e não ficar bagunçado
const databaseDirectory = path.join(__dirname, '..', 'database');

// Cria a pasta caso ela não exista (é pra ela não existir se for a primeira vez)
if (!fs.existsSync(databaseDirectory)) {
    fs.mkdirSync(databaseDirectory, { recursive: true });
}

// Conecta já é feito aqui não acho que dê problema
const db = new Database(
    path.join(databaseDirectory, 'gym.sqlite')
);

// Configurações do SQLite que eu to usando 
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Criação das tabelas vão ser simples até a gente chegar na parte de teste pra poder colocar coisas a ver com o projeto em si
db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'member'
            CHECK(role IN ('member', 'admin', 'trainer')),
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        birth_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS workouts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        trainer_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        exercises TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS checkins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        checkin_date TEXT NOT NULL,
        checkin_time TEXT NOT NULL,

        FOREIGN KEY (member_id)
            REFERENCES members(id)
            ON DELETE CASCADE
    );
`);

// Migração: se já existir uma versão antiga da tabela, ajusta os campos
const checkinColumns = db.prepare('PRAGMA table_info(checkins)').all();
const checkinColumnNames = checkinColumns.map(column => column.name);
const needsCheckinMigration =
    checkinColumns.length > 0 &&
    (!checkinColumnNames.includes('checkin_date') ||
     !checkinColumnNames.includes('checkin_time') ||
     checkinColumnNames.includes('workout_id'));

if (needsCheckinMigration) {
    db.transaction(() => {
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
    })();
}

console.log('Banco de dados SQLite conectado!');

module.exports = db;