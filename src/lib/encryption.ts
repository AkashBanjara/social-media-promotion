import crypto from 'crypto';

/**
 * AES-256-GCM helpers used to encrypt sensitive fields before they touch MongoDB:
 * social account access/refresh tokens and the SMTP password.
 *
 * ENCRYPTION_KEY must be a 64-character hex string (32 bytes). Generate with:
 *   openssl rand -hex 32
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY must be set to a 64-character hex string (32 bytes). Generate one with `openssl rand -hex 32`.'
    );
  }
  return Buffer.from(key, 'hex');
}

/** Returns `iv:authTag:ciphertext`, all hex-encoded, joined with colons. */
export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSecret(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted payload.');
  }
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
