import 'dotenv/config'; // Ensure DB config loads
import pool from '../config/db.js';
import { updateProfile, getMe } from '../controllers/authController.js';
import { listProjects } from '../controllers/projectController.js';

// Mock User Details
const MOCK_EMAIL = 'verify_test_direct@example.com';

const run = async () => {
    try {
        console.log("🚀 Starting Direct Verification...");
        
        // 1. Ensure User Exists
        let userResult = await pool.query("SELECT * FROM users WHERE email = $1", [MOCK_EMAIL]);
        let user = userResult.rows[0];

        if (!user) {
            console.log("Creating test user...");
            const insert = await pool.query(
                "INSERT INTO users (email, full_name, role) VALUES ($1, $2, 'CLIENT') RETURNING *",
                [MOCK_EMAIL, 'Test Client Direct']
            );
            user = insert.rows[0];
        }
        console.log(`User ID: ${user.id}`);

        // Mock Req/Res Helper
        const mockReq = (body = {}) => ({
            user: { id: user.id },
            body
        });
        
        const mockRes = () => {
            const res = {};
            res.status = (code) => {
                res.statusCode = code;
                return res;
            };
            res.json = (data) => {
                res.data = data;
                return res;
            };
            return res;
        };

        // 2. Test Profile Update
        console.log("\n--- Testing Profile Update (Direct Controller) ---");
        const updatedBio = `Bio updated direct at ${new Date().toISOString()}`;
        const reqUpdate = mockReq({ fullName: 'Direct Update', bio: updatedBio });
        const resUpdate = mockRes();
        
        await updateProfile(reqUpdate, resUpdate);
        
        if (resUpdate.data && resUpdate.data.user.bio === updatedBio) {
            console.log("✅ Profile Update Success:", resUpdate.data.message);
        } else {
            console.error("❌ Profile Update Failed:", resUpdate.data || "No data");
            process.exit(1);
        }

        // 3. Test Get Profile
        console.log("\n--- Testing Get Profile (Direct Controller) ---");
        const reqGet = mockReq();
        const resGet = mockRes();
        
        await getMe(reqGet, resGet);
        
        // Note: getMe returns { id, name, email, role, bio, isGithubConnected }
        if (resGet.data && resGet.data.bio === updatedBio) {
             console.log("✅ Profile Retrieval Success");
        } else {
             console.error("❌ Profile Retrieval Failed (Bio mismatch):", resGet.data);
             process.exit(1);
        }

        // 4. Test List Projects
        console.log("\n--- Testing List Projects (Direct Controller) ---");
        
        // Create a dummy project to ensure list isn't empty (optional, but good)
        // We'll just run list first.
        const reqList = mockReq();
        const resList = mockRes();
        
        await listProjects(reqList, resList);
        
        console.log(`✅ Projects Found (Count: ${resList.data.length})`);
        if (resList.data.length > 0) {
             const p = resList.data[0];
             console.log("Sample Project Keys:", Object.keys(p));
             if (p.client_name === undefined) {
                 console.error("❌ client_name missing from result!");
                 process.exit(1);
             } else {
                 console.log("✅ client_name is present:", p.client_name);
             }
        } else {
            console.log("⚠️ No projects found to verify JOIN columns, but query executed successfully.");
        }

        console.log("\n🎉 Verification Finished Successfully.");
        process.exit(0);

    } catch (err) {
        console.error("Verification Script Error:", err);
        process.exit(1);
    }
};

run();
