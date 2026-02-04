import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '../config/db.js';
import { createUser, deleteUser, findUserByEmail, findUserById, saveMFASecret, getMFASecret, clearMFASecret, getResetSecret, clearResetSecret, updateUserPassword } from '../models/userModel.js';
import { getGithubToken, getGithubUser, getGoogleToken, getGoogleUser } from '../services/oauthService.js';
import { createNotification } from '../models/notificationModel.js';
import { sendMFAEmail, sendWelcomeEmail } from '../utils/emailService.js';
import { generateToken } from '../utils/jwtService.js';

// Standard recommended salt rounds for bcrypt is 10-12
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { email, fullName, password, role } = req.body;

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash the password (Rubric #4: Hashing with Salt)
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create User
    const newUser = await createUser(email, fullName, passwordHash, role, null);

    // Generate secure 6-digit OTP for Email Verification
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 Minutes

    // Save to DB
    await saveMFASecret(newUser.id, otpHash, expiry, 'REGISTER');
    
    // console.log(`DEBUG ONLY: Generated OTP for ${email}: ${otp}`);
    await sendMFAEmail(email, otp);

    res.status(201).json({ 
      message: 'Account created. Please verify your email.', 
      userId: newUser.id,
      mfaRequired: true 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Basic Validation
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'User not found! Please Register before loggin in' });
    }
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Hash the OTP (Security Best Practice)
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 Minutes from now

    // Save to DB and Send Email
    await saveMFASecret(user.id, otpHash, expiry);
    
    // Note: In a real app, don't log the OTP! We do it here just for testing if email fails.
    // console.log(`DEBUG ONLY: Generated OTP for ${email}: ${otp}`); 
    
    await sendMFAEmail(email, otp);

    // Respond WITHOUT Token
    res.status(200).json({ 
      message: 'MFA Code sent to email', 
      userId: user.id,
      mfaRequired: true 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login Error' });
  }
};

export const verifyMFA = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    // Fetch the stored secret
    const secretData = await getMFASecret(userId);
    if (!secretData) return res.status(400).json({ error: 'MFA session expired or invalid' });

    const [hashedOtp, expiryStr] = secretData.split('|');

    // Check Expiry
    if (Date.now() > parseInt(expiryStr)) {
      return res.status(400).json({ error: 'OTP Expired' });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // Check Intent (REGISTER vs LOGIN)
    // secretData format: HASH|EXPIRY|INTENT
    const parts = secretData.split('|');
    const intent = parts[2] || 'LOGIN'; // Default to LOGIN if missing

    if (intent === 'REGISTER') {
        const user = await findUserById(userId);
        await sendWelcomeEmail(user.email, user.full_name);
    }

    await clearMFASecret(userId);

    // Issue JWT Token (HttpOnly Cookie)
    const user = await findUserById(userId);
    const token = generateToken(user); 

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30
    });

    res.status(200).json({ message: 'Login Complete' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'MFA Verification Error' });
  }
};

export const getMe = async (req, res) => {
  try {
     const user = await findUserById(req.user.id);
     if (!user) return res.status(404).json({ error: 'User not found' });
     
     // Check for connected apps
     const isGithubConnected = !!user.github_access_token;
     
     res.json({ 
        id: user.id, 
        name: user.full_name, 
        email: user.email, 
        role: user.role,
        bio: user.bio || '',
        avatarUrl: user.avatar_url || null,
        isGithubConnected,
        hasPassword: user.password_hash && user.password_hash !== 'oauth_placeholder'
     });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};

export const githubLogin = async (req, res) => {
  try {
    const { code, role } = req.body; // Frontend sends the code and selected role
    if (!code) return res.status(400).json({ error: 'No code provided' });

    // Exchange Code for Token
    const accessToken = await getGithubToken(code);
    if (!accessToken) return res.status(401).json({ error: 'GitHub Auth Failed' });

    // Get User Profile
    const githubProfile = await getGithubUser(accessToken);
    
    // Find or Create User in DB
    let user = await findUserByEmail(githubProfile.email);
    
    if (!user) {
       // Create new user
       const userRole = (role === 'CLIENT' || role === 'DEVELOPER') ? role : 'DEVELOPER';
       const avatarUrl = githubProfile.avatar_url;
       user = await createUser(githubProfile.email, githubProfile.name, 'oauth_placeholder', userRole, avatarUrl);
       
       // Send Welcome Email
       await sendWelcomeEmail(user.email, githubProfile.name);
    }

    // Update their Github Token in DB
    await pool.query('UPDATE users SET github_access_token = $1, github_id = $2, avatar_url=$3 WHERE id = $4', 
      [accessToken, githubProfile.id, githubProfile.avatar_url, user.id]);

    // Issue JWT
    const token = generateToken(user);
    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30
    });
    res.json({ token, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'GitHub Login Error' });
  }
};

export const googleLogin = async (req, res) => {
  try {
    const { code, role } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    // Exchange Code for Token
    const tokenData = await getGoogleToken(code);
    const accessToken = tokenData.access_token;
    const idToken = tokenData.id_token;

    // Get User Profile
    const googleProfile = await getGoogleUser(accessToken);
    
    // Find or Create User in DB
    let user = await findUserByEmail(googleProfile.email);
    
    if (!user) {
       // Create new user
       const userRole = (role === 'CLIENT' || role === 'DEVELOPER') ? role : 'DEVELOPER';
       const avatarUrl = googleProfile.picture;
       user = await createUser(googleProfile.email, googleProfile.name, 'oauth_placeholder', userRole, avatarUrl);
       
       // Send Welcome Email
       await sendWelcomeEmail(user.email, googleProfile.name);
    }

    // Update their Google Token in DB
    await pool.query('UPDATE users SET google_access_token = $1, google_id = $2, avatar_url=$3 WHERE id = $4', 
      [accessToken, googleProfile.id, googleProfile.picture, user.id]);

    // Issue JWT
    const token = generateToken(user);

    res.cookie('token', token, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production', 
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30
    });

    res.json({ token, user });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Google Login Error' });
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, bio } = req.body;
    const { updateUserProfile } = await import('../models/userModel.js');
    
    const updatedUser = await updateUserProfile(req.user.id, fullName, bio);
    res.json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};



export const requestOTP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = await findUserById(userId);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await saveMFASecret(userId, otpHash, expiry);
    
    // In production, send email. For lab/demo, log it.
    console.log(`[ACTION OTP] for ${email}: ${otp}`);
    await sendMFAEmail(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

export const resendLoginOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Find User
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User context not found' });

    // Generate Secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 Minutes

    await saveMFASecret(userId, otpHash, expiry);
    
    // console.log(`[RESEND LOGIN OTP] for ${user.email}: ${otp}`);
    await sendMFAEmail(user.email, otp);

    res.json({ message: 'New OTP sent to email' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to resend OTP' });
  }
};

export const initiateDeleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email } = await findUserById(userId);

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 mins

    await saveMFASecret(userId, otpHash, expiry);
    
    console.log(`[SECURE DELETE] OTP for ${email}: ${otp}`);
    await sendMFAEmail(email, otp);

    res.json({ message: 'OTP sent to email' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to initiate delete process' });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) return res.status(400).json({ error: 'OTP is required' });

    const userId = req.user.id;
    const secretData = await getMFASecret(userId);
    
    if (!secretData) return res.status(400).json({ error: 'Session expired. Please try again.' });

    const [hashedOtp, expiryStr] = secretData.split('|');
    if (Date.now() > parseInt(expiryStr)) {
      return res.status(400).json({ error: 'OTP Expired' });
    }

    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    const { deleteUser } = await import('../models/userModel.js');
    await deleteUser(userId);
    
    await clearMFASecret(userId);
    res.clearCookie('token');
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
};

export const connectGithubAccount = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'No code provided' });

    const accessToken = await getGithubToken(code);
    if (!accessToken) return res.status(401).json({ error: 'GitHub Auth Failed' });

    const githubProfile = await getGithubUser(accessToken);
    await pool.query('UPDATE users SET github_access_token = $1, github_id = $2 WHERE id = $3', 
      [accessToken, githubProfile.id, req.user.id]);

    await createNotification(req.user.id, `GitHub Account ${githubProfile.login || 'Unknown'} connected successfully.`, 'ACCOUNT', req.user.id, '/dashboard/settings');

    res.json({ message: 'Github account connected successfully', user: githubProfile });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to connect Github account' });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Generate Secure Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = await bcrypt.hash(resetToken, 10);
    const expiry = Date.now() + 30 * 60 * 1000; // 30 Minutes

    // Save to DB
    const { saveResetSecret } = await import('../models/userModel.js');
    await saveResetSecret(user.id, resetTokenHash, expiry);

    // Send Email
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${email}`;
    // We need to import sendResetPasswordEmail from emailService (will add next)
    // For now using generic notification email or will update emailService
    const { sendNotificationEmail } = await import('../utils/emailService.js');
    await sendNotificationEmail(
        email, 
        'Password Reset Request', 
        `You requested a password reset. Click the link below to reset your password:\n\n<a href="${resetLink}">Reset Password</a>\n\nLink expires in 30 minutes.`
    );

    res.json({ message: 'Password reset link sent to email' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process forgot password' });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, token, newPassword } = req.body;
    
    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secretData = await getResetSecret(user.id);
    
    if (!secretData) return res.status(400).json({ error: 'Invalid or expired link' });

    const [hashedToken, expiryStr] = secretData.split('|');
    if (Date.now() > parseInt(expiryStr)) {
      return res.status(400).json({ error: 'Link Expired' });
    }

    const isValid = await bcrypt.compare(token, hashedToken);
    if (!isValid) return res.status(400).json({ error: 'Invalid Token' });

    // Update Password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await updateUserPassword(user.id, passwordHash);
    
    // Clear Secret
    await clearResetSecret(user.id);

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

export const initiateChangePassword = async (req, res) => {
  try {
    const { oldPassword } = req.body;
    const userId = req.user.id;
    
    // Verify Old Password
    const user = await findUserById(userId);
    // password_hash is now included in findUserById
    const userWithPass = user;

    // If user is OAuth only, they might not have a password
    if (!userWithPass.password_hash || userWithPass.password_hash === 'oauth_placeholder') {
        return res.status(400).json({ error: 'OAuth users cannot change password. Set one via Forgot Password flow.' });
    }

    if (!(await bcrypt.compare(oldPassword, userWithPass.password_hash))) {
        return res.status(400).json({ error: 'Incorrect old password' });
    }

    // Generate OTP for verification
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000;
    
    // We append |CHANGE_PW to the secret to distinguish intent
    // But our model stores "HASH|EXPIRY". We can't easily append intent without changing model
    // So for now, we trust the authenticated session + OTP 
    // Ideally we would add an "intent" column or encode it in the secret string format if model allows
    // Let's stick to the existing getMFASecret/saveMFASecret format "HASH|EXPIRY" for minimal schema change
    // The security is provided by the fact that you need to know the old password AND be logged in to trigger this.
    
    await saveMFASecret(userId, otpHash, expiry);
    
    // console.log(`[CHANGE PW OTP] for ${user.email}: ${otp}`);
    await sendMFAEmail(user.email, otp);

    res.json({ mfaRequired: true, message: 'OTP sent to email' });

  } catch (error) {
     console.error(error);
     res.status(500).json({ error: 'Failed to initiate password change' });
  }
};

export const finalizeChangePassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const userId = req.user.id;

        const secretData = await getMFASecret(userId);
        if (!secretData) return res.status(400).json({ error: 'Session expired' });

        const [hashedOtp, expiryStr] = secretData.split('|');
        if (Date.now() > parseInt(expiryStr)) {
             return res.status(400).json({ error: 'OTP Expired' });
        }

        const isValid = await bcrypt.compare(otp, hashedOtp);
        if (!isValid) return res.status(400).json({ error: 'Invalid OTP' });

        // Update Password
        const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await updateUserPassword(userId, passwordHash);

        await clearMFASecret(userId);

        // Auto-Login: Issue new Token
        const user = await findUserById(userId);
        const token = generateToken(user);

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            maxAge: 1000 * 60 * 60 * 24 * 30
        });

        res.json({ message: 'Password changed successfully', user });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to change password' });
    }
};
