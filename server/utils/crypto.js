const crypto = require('crypto');

// Algorithm: AES-256-GCM (authenticated encryption)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// Get encryption key from environment (or generate one)
const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error('ENCRYPTION_KEY not set in environment');
    }
    // Ensure key is 32 bytes
    return crypto.createHash('sha256').update(key).digest();
};

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text in format: iv:authTag:encrypted
 */
const encrypt = (text) => {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return: iv:authTag:encrypted (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt a string encrypted with encrypt()
 * @param {string} encryptedData - Encrypted text in format: iv:authTag:encrypted
 * @returns {string} - Decrypted plain text
 */
const decrypt = (encryptedData) => {
    const key = getEncryptionKey();
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
};

/**
 * Generate a secure random encryption key (for first-time setup)
 * @returns {string} - 64 character hex string
 */
const generateKey = () => {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
};

/**
 * Check if a string appears to be encrypted (contains colons in expected format)
 * @param {string} data - String to check
 * @returns {boolean}
 */
const isEncrypted = (data) => {
    if (!data || typeof data !== 'string') return false;
    const parts = data.split(':');
    // Expected format: iv (32 hex chars):authTag (32 hex chars):encrypted data
    return parts.length === 3 && parts[0].length === 32 && parts[1].length === 32;
};

module.exports = { encrypt, decrypt, generateKey, isEncrypted };
