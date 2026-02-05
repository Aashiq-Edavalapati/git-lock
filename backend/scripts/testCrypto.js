import crypto from 'crypto';
import dotenv from 'dotenv';
import { encryptBuffer, decryptBuffer } from '../src/utils/cryptoService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load Env
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const TEST_DATA = "Hello, this is a secret message!";

console.log("🔒 Starting Crypto Verification...");

// 1. Test New Encryption (Dynamic Key)
try {
    const buffer = Buffer.from(TEST_DATA);
    const encrypted = encryptBuffer(buffer);
    console.log(`✅ Encrypted (New Format): ${encrypted}`);
    
    // Verify format: salt:iv:data
    if (encrypted.split(':').length !== 3) {
        throw new Error("New encryption format is incorrect (should be 3 parts).");
    }

    const decrypted = decryptBuffer(encrypted);
    const decryptedStr = decrypted.toString('utf-8');

    if (decryptedStr === TEST_DATA) {
        console.log("✅ Decryption (New Format) Scceeded!");
    } else {
        throw new Error(`Decryption Mismatch! Expected '${TEST_DATA}', got '${decryptedStr}'`);
    }

} catch (e) {
    console.error("❌ New Encryption Test Failed:", e);
    process.exit(1);
}

// 2. Test Legacy Encryption (Static Key)
try {
    console.log("\n🕰️ Testing Legacy Compatibility...");
    // Simulate old encryption manually (copying old logic)
    const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', KEY, iv);
    const simulatedOldEncrypted = Buffer.concat([cipher.update(Buffer.from(TEST_DATA)), cipher.final()]);
    const legacyString = `${iv.toString('hex')}:${simulatedOldEncrypted.toString('hex')}`;

    console.log(`📦 Simulated Legacy Payload: ${legacyString}`);

    // Try to decrypt using the UPDATED service
    const decryptedLegacy = decryptBuffer(legacyString);
    const decryptedLegacyStr = decryptedLegacy.toString('utf-8');

    if (decryptedLegacyStr === TEST_DATA) {
        console.log("✅ Decryption (Legacy Format) Succeeded!");
    } else {
        throw new Error(`Legacy Decryption Mismatch! Expected '${TEST_DATA}', got '${decryptedLegacyStr}'`);
    }

} catch (e) {
    console.error("❌ Legacy Encryption Test Failed:", e);
    process.exit(1);
}

console.log("\n🎉 All Crypto Tests Passed!");
