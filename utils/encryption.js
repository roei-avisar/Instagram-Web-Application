const crypto = require('crypto');

// AES-256-CBC encryption for sensitive fields like usernames
// We use a RANDOM IV (initialization vector) for each encryption so that even if two users have the same username,
// their encrypted strings in the database will be completely different!
const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES uses 16-byte IVs (initialization vector)

// Get the encryption key from .env and derive a 32-byte key from it
function getKey() {
  const secret = process.env.ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is not set in .env file');
  }
  // Create a consistent 32-byte key from the secret using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

// Encrypt a plaintext string
// Returns a string containing the random IV (initialization vector) and the encrypted text: "ivHex:encryptedHex"
function encrypt(text) {
  if (!text) return text;
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH); // Random IV (initialization vector) every time!

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Combine the IV and encrypted text so we can decrypt it later
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt a string formatted as "ivHex:encryptedHex" back to plaintext
function decrypt(textWithIV) {
  if (!textWithIV) return textWithIV;

  // Split the string to get the IV and the encrypted text
  const parts = textWithIV.split(':');

  // If it doesn't have a ':', it is not formatted correctly. Just return the raw text.
  if (parts.length !== 2) return textWithIV;

  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = getKey();

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
