
import pool from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to get methods
const getMethods = async (userId) => {
    const res = await pool.query('SELECT payout_methods FROM users WHERE id = $1', [userId]);
    return res.rows[0]?.payout_methods || [];
};

// Helper to save methods
const saveMethods = async (userId, methods) => {
    await pool.query('UPDATE users SET payout_methods = $1 WHERE id = $2', [JSON.stringify(methods), userId]);
};

export const addPayoutMethod = async (userId, type, details) => {
    const methods = await getMethods(userId);
    
    const newMethod = {
        id: uuidv4(),
        type,
        details,
        is_primary: methods.length === 0, // First check is simpler here
        created_at: new Date().toISOString()
    };
    
    methods.push(newMethod);
    await saveMethods(userId, methods);
    return newMethod;
};

export const getPayoutMethods = async (userId) => {
    const methods = await getMethods(userId);
    // Sort by primary first
    return methods.sort((a, b) => b.is_primary - a.is_primary);
};

export const deletePayoutMethod = async (id, userId) => {
    let methods = await getMethods(userId);
    const initialLen = methods.length;
    methods = methods.filter(m => m.id !== id);
    
    if (methods.length === initialLen) return null; // Not found
    
    await saveMethods(userId, methods);
    return { success: true };
};

export const setPrimaryPayoutMethod = async (id, userId) => {
    let methods = await getMethods(userId);
    
    let found = false;
    methods = methods.map(m => {
        if (m.id === id) {
            found = true;
            return { ...m, is_primary: true };
        }
        return { ...m, is_primary: false };
    });
    
    if (!found) return null;
    
    await saveMethods(userId, methods);
    return methods.find(m => m.id === id);
};

// Check if user has a valid primary payout method (or blockchain wallet)
export const hasValidPayoutMethod = async (userId) => {
    const userRes = await pool.query('SELECT wallet_address FROM users WHERE id = $1', [userId]);
    if (userRes.rows[0]?.wallet_address) return true;
    const methods = await getMethods(userId);
    return methods.some(m => m.is_primary);
};
