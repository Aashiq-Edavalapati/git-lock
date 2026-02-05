import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

// Ensure master key is available
const MASTER_KEY = process.env.ENCRYPTION_KEY;
if (!MASTER_KEY) {
    console.error("❌ CRITICAL: ENCRYPTION_KEY is missing from environment variables.");
    process.exit(1); 
}

// Convert Master Key to Buffer if it's hex, otherwise use as string
const MASTER_KEY_BUFFER = Buffer.from(MASTER_KEY, 'hex').length === 32 
    ? Buffer.from(MASTER_KEY, 'hex') 
    : Buffer.from(MASTER_KEY); // In case it's a raw string password

const ALGORITHM = 'aes-256-cbc';
const SALT_LENGTH = 16; // 16 bytes for Salt
const IV_LENGTH = 16;   // 16 bytes for IV

// --- Hybrid Encryption (AES + RSA) ---

// Helper: Encrypt Buffer with Hybrid Approach (RSA + Random AES)
// Returns: { encryptedFile (Buffer), encryptedKey (Base64) }
export const encryptHybrid = (buffer, publicKeyPem) => {
    // 1. Generate a ephemeral random AES Key (32 bytes)
    const aesKey = crypto.randomBytes(32);
    const iv = crypto.randomBytes(IV_LENGTH);

    // 2. Encrypt File with this AES Key
    const cipher = crypto.createCipheriv(ALGORITHM, aesKey, iv);
    const encryptedFile = Buffer.concat([cipher.update(buffer), cipher.final()]);
    
    // Format: iv:encryptedData (We store the IV with the file data)
    // Note: We don't use 'salt' here because the key is random, not derived from a master key.
    const filePayload = `${iv.toString('hex')}:${encryptedFile.toString('hex')}`;
    const filePayloadBuffer = Buffer.from(filePayload); // Treat as buffer for consistency

    // 3. Encrypt the AES Key with the Client's Public Key (RSA)
    // RSA-OAEP with SHA-256
    const encryptedKeyBuffer = crypto.publicEncrypt(
        {
            key: publicKeyPem,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        aesKey
    );

    return {
        encryptedFile: filePayload, // String format iv:hex
        encryptedKey: encryptedKeyBuffer.toString('base64')
    };
};

// Helper: Generate SHA-256 Hash (Rubric #4)
export const generateFileHash = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

// Helper: Derive Key from Master Key + Salt (Dynamic Key Derivation)
const deriveKey = (salt) => {
    // using scrypt for strong key derivation
    // 32 bytes = 256 bits for AES-256
    return crypto.scryptSync(MASTER_KEY_BUFFER, salt, 32);
};

// Helper: Encrypt Buffer (Rubric #3 + Secure Key Gen)
export const encryptBuffer = (buffer) => {
  // 1. Generate unique random Salt
  const salt = crypto.randomBytes(SALT_LENGTH);
  
  // 2. Derive Dynamic Key
  const key = deriveKey(salt);

  // 3. Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH);
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // 4. Encrypt
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  
  // 5. Return Salt + IV + Encrypted Data
  // Format: salt:iv:encryptedData
  return `${salt.toString('hex')}:${iv.toString('hex')}:${encrypted.toString('hex')}`;
};

// Helper: Decrypt Buffer
export const decryptBuffer = (encryptedString) => {
  const parts = encryptedString.split(':');

  if (parts.length === 3) {
      // NEW FORMAT: salt:iv:data
      const [saltHex, ivHex, dataHex] = parts;
      
      const salt = Buffer.from(saltHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedText = Buffer.from(dataHex, 'hex');
      
      // Derive the same key using the extracted salt
      const key = deriveKey(salt);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      return Buffer.concat([decipher.update(encryptedText), decipher.final()]);

  } else if (parts.length === 2) {
      // LEGACY FORMAT: iv:data (Static Key)
      // This ensures backward compatibility for files encrypted before this update
      const [ivHex, dataHex] = parts;
      
      const iv = Buffer.from(ivHex, 'hex');
      const encryptedText = Buffer.from(dataHex, 'hex');
      
      const LEGACY_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, LEGACY_KEY, iv);
      return Buffer.concat([decipher.update(encryptedText), decipher.final()]);
  } else {
      throw new Error("Invalid Encrypted Data Format");
  }
};