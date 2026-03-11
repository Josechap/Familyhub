const { encrypt, decrypt, isEncrypted } = require('../utils/crypto');

const getPaprikaCredentials = (db) => {
    try {
        const row = db.prepare('SELECT value FROM settings WHERE key = ?').get('paprika_credentials');
        if (!row?.value) {
            return null;
        }

        if (isEncrypted(row.value)) {
            return JSON.parse(decrypt(row.value));
        }

        const credentials = JSON.parse(row.value);
        db.prepare('UPDATE settings SET value = ? WHERE key = ?').run(encrypt(row.value), 'paprika_credentials');
        return credentials;
    } catch (error) {
        console.error('Error reading Paprika credentials:', error.message);
        return null;
    }
};

const savePaprikaCredentials = (db, email, password, token) => {
    const payload = JSON.stringify({ email, password, token });
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(
        'paprika_credentials',
        encrypt(payload)
    );
};

const clearPaprikaCredentials = (db) => {
    db.prepare('DELETE FROM settings WHERE key = ?').run('paprika_credentials');
};

module.exports = {
    getPaprikaCredentials,
    savePaprikaCredentials,
    clearPaprikaCredentials,
};
