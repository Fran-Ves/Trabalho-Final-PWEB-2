// Mecanismo de migrações versionadas.
// Cada arquivo NNN_nome.js exporta { up(db) } e roda uma única vez, em ordem.
// As versões aplicadas ficam registradas na tabela schema_migrations.

const fs = require('fs');
const path = require('path');

function appliedVersions(db) {
    return new Set(
        db.prepare('SELECT version FROM schema_migrations').all()
            .map(row => row.version)
    );
}

function run(db) {

    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            version TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const files = fs.readdirSync(__dirname)
        .filter(file => /^\d+_.+\.js$/.test(file))
        .sort();

    for (const file of files) {

        const version = file.split('_')[0];
        const name = file.replace(/\.js$/, '');

        if (appliedVersions(db).has(version)) continue;

        const migration = require(path.join(__dirname, file));

        try {
            db.transaction(() => {
                migration.up(db);

                db.prepare(`
                    INSERT INTO schema_migrations (version, name)
                    VALUES (?, ?)
                `).run(version, name);
            })();

            console.log(`Migração aplicada: ${name}`);

        } catch (error) {
            // Outra réplica pode ter aplicado a mesma migração ao mesmo tempo
            if (appliedVersions(db).has(version)) continue;
            throw error;
        }
    }
}

module.exports = { run };
