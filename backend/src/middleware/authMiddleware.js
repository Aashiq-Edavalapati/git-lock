import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  // Read token from Cookie OR Auth Header
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access Denied: No Token' });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach user info (id, role) to the request
    // console.log(verified)
    next();
  } catch (error) {
    res.status(403).json({ error: 'Invalid Token' });
  }
};

// --- ACCESS CONTROL MATRIX ---
const ACL_MATRIX = {
    // 1. PROJECT DETAILS
    'PROJECT_DETAILS': {
        'CLIENT': ['CREATE', 'READ'],
        'DEVELOPER': ['READ', 'ACCEPT'],
        'ADMIN': ['READ'] // Audit
    },
    // 2. SOURCE CODE
    'SOURCE_CODE': {
        'CLIENT': ['READ'], // Logic inside controller handles "only after unlock"
        'DEVELOPER': ['UPLOAD', 'READ'], 
        'ADMIN': [] // No Access (Privacy)
    },
    // 3. PAYMENT LOGS
    'PAYMENT_LOGS': {
        'CLIENT': ['CREATE', 'READ'],
        'DEVELOPER': ['READ'], // Access to own earnings
        'ADMIN': ['READ'] // Audit
    }
};

export const checkAcl = (resource, action) => {
    return (req, res, next) => {
        const userRole = req.user?.role;

        if (!userRole) {
            return res.status(403).json({ error: 'Access Denied: No Role' });
        }

        // Check if resource exists in matrix
        if (!ACL_MATRIX[resource]) {
            console.error(`ACL Error: Resource ${resource} not defined`);
            return res.status(500).json({ error: 'Internal ACL Error' });
        }

        const allowedActions = ACL_MATRIX[resource][userRole] || [];

        if (allowedActions.includes(action)) {
            next();
        } else {
             // Log Unauthorized Access Attempt
             const userId = req.user.id;
             // Using fire-and-forget for logging to not block response
             import('../config/db.js').then(({ default: pool }) => {
                pool.query(
                    `INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)`,
                    [userId, 'UNAUTHORIZED_ACCESS', JSON.stringify({ resource, action, role: userRole, ip: req.ip })]
                ).catch(err => console.error("Failed to log unauthorized access", err));
             });

            return res.status(403).json({ 
                error: `Access Denied: role '${userRole}' cannot perform '${action}' on '${resource}'.` 
            });
        }
    };
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access Denied: Requires ${role} role` });
    }
    next();
  };
};