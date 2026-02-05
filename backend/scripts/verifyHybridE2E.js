
import axios from 'axios';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import pool from '../src/config/db.js';
import bcrypt from 'bcrypt';

// --- CONFIG ---
const API_URL = 'http://localhost:5000/api';
const EMAIL = `test_h_${Date.now()}@example.com`;
const PASSWORD = 'password123';
const TEST_FILE_CONTENT = "This is a secret project content only for the client eyes!";

// --- 1. Client-Side Key Gen Simulation (Node.js style) ---
const generateKeys = () => {
    return crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
};

// --- MAIN FLOW ---
async function runTest() {
    console.log("🚀 STARTING E2E VERIFICATION...");
    try {
        const keys = generateKeys();
        console.log("🔑 Generated Client Keys");

        // --- 1. SIMULATE SOCIAL LOGIN REGISTRATION (No Key Initially) ---
        console.log(`\n--- 1. Social Login Simulation (Register without Key) ---`);
        const regRes = await axios.post(`${API_URL}/auth/register`, {
            fullName: "Hybrid Social User",
            email: EMAIL,
            password: PASSWORD,
            role: "CLIENT" 
            // NO PUBLIC KEY SENT HERE
        });
        
        const userId = regRes.data.userId;
        console.log(`✅ Registered User ID (No Key): ${userId}`);
        
        // --- MFA BYPASS ---
        console.log("🔄 Bypassing MFA for Test User...");
        const knownOTP = "123456";
        const otpHash = await bcrypt.hash(knownOTP, 10);
        const expiry = Date.now() + 10 * 60 * 1000;
        const secretData = `${otpHash}|${expiry}|REGISTER`;
        
        await pool.query('UPDATE users SET mfa_secret = $1 WHERE id = $2', [secretData, userId]);
        
        // Verify MFA & Get Token
        const verifyRes = await axios.post(`${API_URL}/auth/verify-mfa`, {
            userId: userId,
            otp: knownOTP
        });
        
        const setCookie = verifyRes.headers['set-cookie'];
        if (!setCookie) throw new Error("No token cookie received");
        const token = setCookie.find(c => c.startsWith('token=')).split(';')[0].split('=')[1];
        console.log(`✅ MFA Verified. Client Token obtained.`);

        // --- 1.5 UPLOAD PUBLIC KEY (Simulating Social Login Fix) ---
        console.log("\n--- 1.5 Uploading Public Key (Simulating Social Login Fix) ---");
        await axios.post(`${API_URL}/auth/public-key`, {
            publicKey: keys.publicKey
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log("✅ Public Key Uploaded Successfully");
        
        // VERIFY DB
        const dbRes = await pool.query('SELECT public_key FROM users WHERE id = $1', [userId]);
        const dbKey = dbRes.rows[0]?.public_key;
        
        // Normalize keys for comparison (remove whitespace/newlines if needed, but usually exact match)
        if (dbKey && dbKey.trim() === keys.publicKey.trim()) {
             console.log("✅ VERIFICATION SUCCESS: Public Key stored in Database matches generated key.");
        } else {
             throw new Error("❌ VERIFICATION FAILED: Database key does not match uploaded key.");
        }
        
        console.log("\n🎉 Social Login Key Fix Verified! (Skipping GitHub-dependent steps)");
        return; // Exit success

    } catch (e) {
        console.error("\n❌ TEST FAILED:", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
        }
    } finally {
        await pool.end();
    }
}

runTest();
