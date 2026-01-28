import 'dotenv/config'; // Ensure DB config loads
import pool from '../config/db.js';
import { createUser, findUserById } from '../models/userModel.js';
import { getMe } from '../controllers/authController.js';

const run = async () => {
    try {
        console.log("🚀 Starting Avatar Verification...");

        // 1. Create User with Avatar
        const email = `avatar_test_${Date.now()}@example.com`;
        const avatarUrl = 'https://example.com/my-pic.jpg';
        
        console.log("Creating user with avatar:", avatarUrl);
        // Note: createUser now takes 5 args
        const newUser = await createUser(email, 'Avatar Tester', 'hash', 'CLIENT', avatarUrl);
        
        if (newUser.avatar_url !== avatarUrl) {
            throw new Error(`CreateUser failed to save avatar. Got: ${newUser.avatar_url}`);
        }
        console.log("✅ User created with avatar.");

        // 2. Test FindUserById
        const found = await findUserById(newUser.id);
        if (found.avatar_url !== avatarUrl) {
            throw new Error(`findUserById failed to retrieve avatar. Got: ${found.avatar_url}`);
        }
        console.log("✅ findUserById retrieved avatar.");

        // 3. Test getMe Controller Response
        const mockReq = { user: { id: newUser.id } };
        const mockRes = {
            json: (data) => {
                if (data.avatarUrl === avatarUrl) {
                     console.log("✅ getMe controller returns avatarUrl correctly.");
                } else {
                     console.error("❌ getMe controller returned:", data);
                     process.exit(1);
                }
            },
            status: (code) => ({ json: (d) => console.error("Error Status:", code, d) })
        };
        
        await getMe(mockReq, mockRes);

        console.log("🎉 Avatar Verification Success!");
        process.exit(0);

    } catch (err) {
        console.error("Verification Error:", err);
        process.exit(1);
    }
};

run();
