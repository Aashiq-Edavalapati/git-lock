import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import pool from '../config/db.js';
import { decryptBuffer } from '../utils/cryptoService.js';

// 1. Create Payment Order
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR' } = req.body;
    
    const options = {
      amount: amount * 100, 
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment Order Failed' });
  }
};

// 2. Verify Payment & Unlock Code
export const verifyAndUnlock = async (req, res) => {
  const client = await pool.connect(); // Use a transaction client
  
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      projectId 
    } = req.body;

    // A. Cryptographic Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid Signature! Payment Tampered.' });
    }

    console.log("✅ Payment Signature Verified. Unlocking Assets...");

    // B. Database Transaction (Ensure atomicity)
    await client.query('BEGIN');

    // 1. Get the Encrypted Project Data
    const versionQuery = `
      SELECT encrypted_blob, zip_hash 
      FROM project_versions 
      WHERE project_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `;
    const versionResult = await client.query(versionQuery, [projectId]);

    if (versionResult.rows.length === 0) {
      throw new Error('No locked code found for this project');
    }

    const { encrypted_blob } = versionResult.rows[0];

    // 2. Update Project Status to COMPLETED
    await client.query(
      `UPDATE projects SET status = 'COMPLETED' WHERE id = $1`, 
      [projectId]
    );

    await client.query('COMMIT');

    // C. Decryption
    const encryptedString = encrypted_blob.toString('utf-8'); 
    const decryptedBuffer = decryptBuffer(encryptedString);

    // D. Send File to Client
    res.set({
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="project_${projectId}_unlocked.zip"`,
      'Content-Length': decryptedBuffer.length
    });

    res.send(decryptedBuffer);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Unlock Failed' });
  } finally {
    client.release();
  }
};