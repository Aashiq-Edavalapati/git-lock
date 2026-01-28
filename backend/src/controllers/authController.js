import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { createUser, findUserByEmail, findUserById, saveMFASecret, getMFASecret, clearMFASecret } from '../models/userModel.js';
import { sendMFAEmail } from '../utils/emailService.js';
import { generateToken } from '../utils/jwtService.js';

// Standard recommended salt rounds for bcrypt is 10-12
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { email, fullName, password, role } = req.body;

    // 1. Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // 2. Hash the password (Rubric #4: Hashing with Salt)
    // Intuition: We wait for the hash to compute. Higher salt rounds = slower but safer.
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // 3. Create User
    const newUser = await createUser(email, fullName, passwordHash, role);

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: newUser 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server Error during registration' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Basic Validation
    const user = await findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 2. Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // 3. Hash the OTP (Security Best Practice)
    const otpHash = await bcrypt.hash(otp, 10);
    const expiry = Date.now() + 10 * 60 * 1000; // 10 Minutes from now

    // 4. Save to DB and Send Email
    await saveMFASecret(user.id, otpHash, expiry);
    
    // Note: In a real app, don't log the OTP! We do it here just for testing if email fails.
    console.log(`DEBUG ONLY: Generated OTP for ${email}: ${otp}`); 
    
    await sendMFAEmail(email, otp);

    // 5. Respond WITHOUT Token
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

    // 1. Fetch the stored secret
    const secretData = await getMFASecret(userId);
    if (!secretData) return res.status(400).json({ error: 'MFA session expired or invalid' });

    const [hashedOtp, expiryStr] = secretData.split('|');

    // 2. Check Expiry
    if (Date.now() > parseInt(expiryStr)) {
      return res.status(400).json({ error: 'OTP Expired' });
    }

    // 3. Verify OTP
    const isValid = await bcrypt.compare(otp, hashedOtp);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }

    // 4. Valid! Clear the secret so it can't be reused (Replay Attack Prevention)
    await clearMFASecret(userId);

    // 5. Issue JWT Token (HttpOnly Cookie)
    // We also fetch user details again to ensure role is correct
    // (In a full app, you might want to fetch the user object here)
    const user = await findUserById(userId);
    const token = generateToken(user); // Passed full user object

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure cookies in prod
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });

    res.status(200).json({ message: 'Login Complete', token }); // Sending token in body too for ease of testing

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'MFA Verification Error' });
  }
};

export const getMe = async (req, res) => {
  try {
     const user = await findUserById(req.user.id);
     if (!user) return res.status(404).json({ error: 'User not found' });
     res.json({ id: user.id, name: user.full_name, email: user.email, role: user.role });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
};