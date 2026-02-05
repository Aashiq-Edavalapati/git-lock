import pool from '../config/db.js';

// Get Payment Logs (derived from Audit logs with action='PAYMENT')
// Only ADMIN can see this (as per ACL), or possibly Client for their projects
export const getPaymentLogs = async (req, res) => {
    // Note: The ACL check checkAcl('PAYMENT_LOGS', 'READ') should already be passed before this.
    try {
        const { role, id } = req.user;
        let query = '';
        let params = [];

        if (role === 'ADMIN') {
            // Admin sees ALL payments
            query = `
                SELECT al.id, al.action, al.details, al.timestamp, u.email as user_email
                FROM audit_logs al
                LEFT JOIN users u ON al.user_id = u.id
                WHERE al.action IN ('PAYMENT', 'PAYMENT_FAILED')
                ORDER BY al.timestamp DESC
            `;
        } else if (role === 'CLIENT') {
            // Client sees payments related to them (where they are the payer, i.e., user_id)
            query = `
                SELECT id, action, details, timestamp 
                FROM audit_logs 
                WHERE action IN ('PAYMENT', 'PAYMENT_FAILED') AND user_id = $1
                ORDER BY timestamp DESC
            `;
            params = [id];
        } else if (role === 'DEVELOPER') {
             // Developer sees payments for projects where they are the developer
             // The payment details JSON stores project_id. We can join with projects table or filter by JSON.
             // Best to join projects to verify ownership or simply trust the details if we trust the logger.
             // Let's join for security.
             // Correction: The audit_log stores user_id of the PAYER (Client).
             // We need to find logs where details->>'projectId' belongs to a project where developer_id = req.user.id
             
             query = `
                SELECT al.id, al.action, al.details, al.timestamp
                FROM audit_logs al
                JOIN projects p ON (al.details->>'projectId')::uuid = p.id
                WHERE al.action IN ('PAYMENT', 'PAYMENT_FAILED')
                AND p.developer_id = $1
                ORDER BY al.timestamp DESC
             `;
             params = [id];
        } else {
             // Should verify ACL again just in case, or return empty
             return res.status(403).json({ error: "Unauthorized to view payment logs" });
        }

        const result = await pool.query(query, params);
        res.json(result.rows);

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Failed to retrieve payment logs" });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        // 1. Intrusion Detection (Last 24 Hours)
        // Group by hour to allow graph plotting
        const intrusionQuery = `
            SELECT 
                date_trunc('hour', timestamp) as hour,
                COUNT(*) as count
            FROM audit_logs 
            WHERE action IN ('LOGIN_FAILED', 'UNAUTHORIZED_ACCESS') 
            AND timestamp > NOW() - INTERVAL '24 hours'
            GROUP BY 1
            ORDER BY 1 ASC
        `;
        const intrusionRes = await pool.query(intrusionQuery);

        // 2. Escrow Vault Status
        // Compare Locked vs Released amounts
        const escrowQuery = `
            SELECT 
                COALESCE(SUM(budget) FILTER (WHERE status = 'LOCKED_REVIEW'), 0) as locked_funds,
                COALESCE(SUM(budget) FILTER (WHERE status = 'COMPLETED'), 0) as released_funds
            FROM projects
        `;
        const escrowRes = await pool.query(escrowQuery);

        // 3. User Risk Scoring
        const riskQuery = `
            SELECT 
                u.email,
                u.full_name,
                COUNT(*) FILTER (WHERE al.action = 'LOGIN_FAILED') * 10 +
                COUNT(*) FILTER (WHERE al.action = 'UNAUTHORIZED_ACCESS') * 50 as risk_score
            FROM users u
            JOIN audit_logs al ON u.id = al.user_id
            WHERE al.timestamp > NOW() - INTERVAL '7 days'
            GROUP BY u.id
            HAVING (COUNT(*) FILTER (WHERE al.action = 'LOGIN_FAILED') * 10 + COUNT(*) FILTER (WHERE al.action = 'UNAUTHORIZED_ACCESS') * 50) > 0
            ORDER BY risk_score DESC
            LIMIT 10
        `;
        const riskRes = await pool.query(riskQuery);

        // 4. Activity Distribution (For Pie Chart)
        const distQuery = `
            SELECT action, COUNT(*) as count 
            FROM audit_logs 
            WHERE timestamp > NOW() - INTERVAL '30 days'
            GROUP BY action
        `;
        const distRes = await pool.query(distQuery);

        // 5. Recent Activity Log (For Table)
        const recentQuery = `
            SELECT al.*, u.email, u.full_name 
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.timestamp DESC
            LIMIT 50
        `;
        const recentRes = await pool.query(recentQuery);

        res.json({
            intrusionGraph: intrusionRes.rows,
            escrowStats: escrowRes.rows[0],
            riskTable: riskRes.rows,
            activityDistribution: distRes.rows,
            recentActivity: recentRes.rows
        });

    } catch (e) {
        console.error("Admin Stats Error:", e);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
};
