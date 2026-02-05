
// Mock Express objects
const mockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.body = data;
        return res;
    };
    return res;
};

const mockNext = () => {
    return 'NEXT_CALLED';
};

// Import the middleware (we need to use dynamic import or ensure type:module is set)
// optimizing by reading the file content and eval-ing just the logic or just copying the matrix for test
// faster to just write a test file that imports the middleware relative path

import { checkAcl } from '../src/middleware/authMiddleware.js';

const runTest = async () => {
    console.log("--- ACL LOGIC VERIFICATION ---");

    const tests = [
        // RESOURCE: PROJECT_DETAILS
        { role: 'CLIENT', resource: 'PROJECT_DETAILS', action: 'CREATE', expected: 200 },
        { role: 'CLIENT', resource: 'PROJECT_DETAILS', action: 'READ', expected: 200 },
        { role: 'DEVELOPER', resource: 'PROJECT_DETAILS', action: 'READ', expected: 200 },
        { role: 'DEVELOPER', resource: 'PROJECT_DETAILS', action: 'ACCEPT', expected: 200 },
        { role: 'ADMIN', resource: 'PROJECT_DETAILS', action: 'READ', expected: 200 },
        { role: 'ADMIN', resource: 'PROJECT_DETAILS', action: 'CREATE', expected: 403 }, // Admin shouldn't create projects
        
        // RESOURCE: SOURCE_CODE
        { role: 'CLIENT', resource: 'SOURCE_CODE', action: 'READ', expected: 200 }, // Allowed by ACL, blocked by controller if locked
        { role: 'DEVELOPER', resource: 'SOURCE_CODE', action: 'UPLOAD', expected: 200 },
        { role: 'ADMIN', resource: 'SOURCE_CODE', action: 'READ', expected: 403 }, // NO ACCESS

        // RESOURCE: PAYMENT_LOGS
        { role: 'CLIENT', resource: 'PAYMENT_LOGS', action: 'READ', expected: 200 },
        { role: 'DEVELOPER', resource: 'PAYMENT_LOGS', action: 'READ', expected: 403 }, // NO ACCESS
        { role: 'ADMIN', resource: 'PAYMENT_LOGS', action: 'READ', expected: 200 },
    ];

    let passed = 0;
    let failed = 0;

    for (const t of tests) {
        const req = { user: { role: t.role, id: 'test-id' } };
        const res = mockRes();
        let nextCalled = false;
        const next = () => { nextCalled = true; };

        const middleware = checkAcl(t.resource, t.action);
        middleware(req, res, next);

        let resultStatus;
        if (nextCalled) resultStatus = 200;
        else resultStatus = res.statusCode;

        if (resultStatus === t.expected) {
            // console.log(`✅ [PASS] ${t.role} -> ${t.resource} (${t.action}) = ${resultStatus}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${t.role} -> ${t.resource} (${t.action}). Expected ${t.expected}, got ${resultStatus}`);
            failed++;
        }
    }

    console.log(`\nTest Summary: ${passed} Passed, ${failed} Failed`);
    if (failed === 0) console.log("ACL Matrix Logic Verified Successfully!");
};

runTest();
