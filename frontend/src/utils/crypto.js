// Utility for Hybrid Encryption (RSA + AES)
// Uses Web Crypto API

// 1. Generate RSA Key Pair (2048-bit)
export const generateKeyPair = async () => {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: "SHA-256",
        },
        true, // extractable
        ["encrypt", "decrypt"]
    );

    // Export to PEM for storage/transfer
    const publicKeyPem = await exportKeyToPem(keyPair.publicKey, "PUBLIC");
    const privateKeyPem = await exportKeyToPem(keyPair.privateKey, "PRIVATE");

    return { publicKeyPem, privateKeyPem };
};

// Helper: Export Key to PEM
const exportKeyToPem = async (key, type) => {
    const format = type === "PUBLIC" ? "spki" : "pkcs8";
    const exported = await window.crypto.subtle.exportKey(format, key);
    const base64 = arrayBufferToBase64(exported);
    const header = type === "PUBLIC" ? "-----BEGIN PUBLIC KEY-----" : "-----BEGIN PRIVATE KEY-----";
    const footer = type === "PUBLIC" ? "-----END PUBLIC KEY-----" : "-----END PRIVATE KEY-----";
    return `${header}\n${base64}\n${footer}`;
};

// Helper: Import PEM to Key
const importKeyFromPem = async (pem, type) => {
    // Remove headers/footers and newlines
    const pemHeader = type === "PUBLIC" ? "-----BEGIN PUBLIC KEY-----" : "-----BEGIN PRIVATE KEY-----";
    const pemFooter = type === "PUBLIC" ? "-----END PUBLIC KEY-----" : "-----END PRIVATE KEY-----";
    
    const pemContents = pem
        .replace(pemHeader, "")
        .replace(pemFooter, "")
        .replace(/\n/g, "")
        .trim();

    const binaryDer = base64ToArrayBuffer(pemContents);

    return await window.crypto.subtle.importKey(
        type === "PUBLIC" ? "spki" : "pkcs8",
        binaryDer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256",
        },
        true,
        type === "PUBLIC" ? ["encrypt"] : ["decrypt"]
    );
};

// 2. Decrypt Hybrid Payload (Client-Side)
// encryptedFileStr: "ivHex:encryptedDataHex"
// encryptedKeyBase64: Base64 string of RSA-encrypted AES Key
// privateKeyPem: PEM string
export const decryptHybrid = async (encryptedFileStr, encryptedKeyBase64, privateKeyPem) => {
    try {
        console.log("🔓 Starting Hybrid Decryption...");
        
        // A. Import Private Key
        const privateKey = await importKeyFromPem(privateKeyPem, "PRIVATE");

        // B. Decrypt AES Key (RSA)
        const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKeyBase64);
        const aesKeyBuffer = await window.crypto.subtle.decrypt(
            { name: "RSA-OAEP" },
            privateKey,
            encryptedKeyBuffer
        );
        
        // Import the decrypted AES key
        const aesKey = await window.crypto.subtle.importKey(
            "raw",
            aesKeyBuffer,
            "AES-CBC",
            false,
            ["decrypt"]
        );
        console.log("✅ AES Key Decrypted successfully.");

        // C. Decrypt File (AES)
        // Parse iv:data
        const [ivHex, dataHex] = encryptedFileStr.split(':');
        const iv = hexToArrayBuffer(ivHex);
        const data = hexToArrayBuffer(dataHex);

        const decryptedBuffer = await window.crypto.subtle.decrypt(
            { name: "AES-CBC", iv: iv },
            aesKey,
            data
        );
        
        console.log("✅ File Data Decrypted successfully.");
        return decryptedBuffer;

    } catch (e) {
        console.error("Hybrid Decryption Failed:", e);
        throw new Error("Decryption Failed. Ensure you have the correct Private Key.");
    }
};

// --- ArrayBuffer Utils ---
const arrayBufferToBase64 = (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

const base64ToArrayBuffer = (base64) => {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
};

const hexToArrayBuffer = (hex) => {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
};
