import { saveMFASecret } from '../models/userModel.js';
import crypto from 'crypto';

export const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

export const storeMFASecret = async (userId, tokenData) => {
    const [secret, expiry] = tokenData.split('|');
    await saveMFASecret(userId, secret, expiry);
};

export const getMFASecret = async (userId) => {
    // This is just a placeholder if needed, but currently projectController imports it from userModel.
    // Leaving it out to avoid confusion unless required by other modules.
};
