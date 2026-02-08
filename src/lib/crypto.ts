import crypto from 'crypto';

// Use a fixed key for simplicity, or ideally load from environment
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-32-chars-long!!!!'; // Must be 32 chars for AES-256
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)); // Ensure 32 bytes
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text: string): string {
    try {
        const textParts = text.split(':');
        const iv = Buffer.from(textParts.shift() as string, 'hex');
        const encryptedText = Buffer.from(textParts.join(':'), 'hex');
        const keyBuffer = Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)); // Ensure 32 bytes
        const decipher = crypto.createDecipheriv('aes-256-cbc', keyBuffer, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        throw new Error('Decryption failed');
    }
}
