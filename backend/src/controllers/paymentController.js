import crypto from 'crypto';
import razorpay from '../config/razorpay.js';
import pool from '../config/db.js';
import { createNotification } from '../models/notificationModel.js';
import { findProjectById } from '../models/projectModel.js';
import { findUserById } from '../models/userModel.js';
import { hasValidPayoutMethod } from '../models/payoutModel.js';
import { sendNotificationEmail } from '../utils/emailService.js';

// Create Payment Order
export const createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', projectId } = req.body;
    
    // Validate Developer Payout Method
    if (projectId) {
        const project = await findProjectById(projectId);
        if (project && project.developer_id) {
            const hasPayout = await hasValidPayoutMethod(project.developer_id);
            if (!hasPayout) {
                // NOTIFICATION LOGIC
                // 1. In-App Notification
                await createNotification(
                    project.developer_id, 
                    `Action Required: Client attempted to pay for "${project.title}" but failed because you haven't set a Payout Method. Please Configure it in Settings.`,
                    'PAYMENT',
                    project.id,
                    '/dashboard/settings'
                );

                // 2. Email Notification
                const dev = await findUserById(project.developer_id);
                if (dev) {
                    await sendNotificationEmail(
                        dev.email,
                        "Action Required: Payment Blocked",
                        `Hello ${dev.full_name},\n\nThe client for project "${project.title}" attempted to release the payment, but the transaction was blocked because you have not set up a valid Payout Method.\n\nPlease go to your Settings > Payout Method and add a UPI ID or Bank Account immediately to receive funds.\n\n- GitLock Team`
                    );
                }

                return res.status(400).json({ 
                    error: "Developer has not set up a payout method. Payment cannot be processed.",
                    code: "NO_PAYOUT_METHOD"
                });
            }
        }
    }

    // Ensure amount is handled as integer (paise)
    const amountInPaise = Math.round(parseFloat(amount) * 100);
    console.log(`Making Razorpay Order: ₹${amount} -> ${amountInPaise} paise`);

    const options = {
      amount: amountInPaise, 
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    console.log(`✅ Order Created: ${order.id} | Amount: ${order.amount}`);
    res.json(order);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Payment Order Failed' });
  }
};

// Get Razorpay Key (Public)
export const getRazorpayKey = (req, res) => {
    console.log("🔑 Sending Razorpay Key to Frontend:", process.env.RAZORPAY_KEY_ID);
    res.json({ key: process.env.RAZORPAY_KEY_ID });
};

// Verify Payment & Unlock Code
export const verifyAndUnlock = async (req, res) => {
  const client = await pool.connect(); // Use a transaction client
  
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      projectId 
    } = req.body;

    // Cryptographic Verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid Signature! Payment Tampered.' });
    }

    console.log("✅ Payment Signature Verified. Unlocking Assets...");

    // Database Transaction (Ensure atomicity)
    await client.query('BEGIN');

    // Get the Encrypted Project Data
    const versionQuery = `
      SELECT id
      FROM project_versions 
      WHERE project_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `;
    const versionResult = await client.query(versionQuery, [projectId]);

    if (versionResult.rows.length === 0) {
      throw new Error('No locked code found for this project');
    }

    // Update Project Status to COMPLETED
    await client.query(
      `UPDATE projects SET status = 'COMPLETED' WHERE id = $1`, 
      [projectId]
    );

    await client.query('COMMIT');

    // Notifications
    const project = await findProjectById(projectId);
    if(project) {
        await createNotification(project.client_id, `Payment Successful. Project "${project.title}" Unlocked.`, 'PAYMENT', projectId, `/dashboard/escrow/${projectId}`);
        await createNotification(project.developer_id, `Payment Secured in Escrow for "${project.title}". Code Released.`, 'PAYMENT', projectId, `/dashboard/escrow/${projectId}`);
    }

    res.status(200).json({ success: true, message: "Payment Verified & Project Unlocked" });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error);
    res.status(500).json({ error: 'Unlock Failed' });
  } finally {
    client.release();
  }
};