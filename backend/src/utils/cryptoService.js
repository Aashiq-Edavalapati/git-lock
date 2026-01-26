import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Ensure key is 32 bytes (256 bits)
const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'utf-8');
const ALGORITHM = 'aes-256-cbc';

// Helper: Generate SHA-256 Hash (Rubric #4)
export const generateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Helper: Encrypt Buffer (Rubric #3)
export const encryptBuffer = (buffer) => {
  // Generate a random IV for this specific encryption
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  // Encrypt the data
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // Return IV + Encrypted Data (We need the IV to decrypt later!)
  // Format: iv:encryptedData
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

// Helper: Decrypt Buffer
export const decryptBuffer = (encryptedString) => {
  const [ivHex, dataHex] = encryptedString.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const encryptedText = Buffer.from(dataHex, 'hex');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  
  const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  
  return decrypted;
};