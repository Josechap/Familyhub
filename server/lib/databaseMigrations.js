const { encrypt, isEncrypted } = require('../utils/crypto');

const hasColumn = (db, tableName, columnName) => {
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    return columns.some((column) => column.name === columnName);
};

const ensureColumn = (db, tableName, columnName, definition) => {
    if (!hasColumn(db, tableName, columnName)) {
        db.prepare(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`).run();
    }
};

const migratePaprikaCredentials = (db) => {
    const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('paprika_credentials');
    if (!row?.value || isEncrypted(row.value)) {
        return;
    }

    try {
        const encryptedValue = encrypt(row.value);
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(encryptedValue, 'paprika_credentials');
    } catch (error) {
        console.error('Paprika credential migration skipped:', error.message);
    }
};

const backfillRoutineColumns = (db) => {
    db.prepare(`
        UPDATE chores
        SET schedule_type = CASE recurring
            WHEN 'daily' THEN 'daily'
            WHEN 'weekly' THEN 'weekly'
            ELSE 'manual'
        END
        WHERE schedule_type IS NULL OR schedule_type = ''
    `).run();

    db.prepare("UPDATE chores SET active = 1 WHERE active IS NULL").run();
    db.prepare("UPDATE calendar_events SET event_type = 'general' WHERE event_type IS NULL OR event_type = ''").run();
};

const runDatabaseMigrations = (db) => {
    ensureColumn(db, 'chores', 'schedule_type', "TEXT DEFAULT 'manual'");
    ensureColumn(db, 'chores', 'days_of_week', 'TEXT');
    ensureColumn(db, 'chores', 'due_time', 'TEXT');
    ensureColumn(db, 'chores', 'cycle_key', 'TEXT');
    ensureColumn(db, 'chores', 'active', 'INTEGER DEFAULT 1');

    ensureColumn(db, 'calendar_events', 'event_type', "TEXT DEFAULT 'general'");

    ensureColumn(db, 'task_completions', 'task_id', 'TEXT');
    ensureColumn(db, 'task_completions', 'cycle_key', 'TEXT');

    db.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_shopping_items_normalized_label
        ON shopping_items(normalized_label)
    `);

    backfillRoutineColumns(db);
    migratePaprikaCredentials(db);
};

module.exports = {
    runDatabaseMigrations,
};
