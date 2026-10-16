import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const getFrontendUrl = () => {
  return (process.env.FRONTEND_URL || 'http://localhost:3000').split(',')[0].trim().replace(/\/$/, '');
};

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return null;
  }

  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    logger: process.env.NODE_ENV !== 'production',
    debug: process.env.NODE_ENV !== 'production',
  });
};

const getEmailTemplate = (header, bodyContent) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; background-color: #f4f4f4; padding: 40px 0; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background-color: #1a1a1a; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 40px 30px; color: #333333; line-height: 1.6; font-size: 16px; }
        .footer { background-color: #f9f9f9; padding: 20px; text-align: center; color: #888888; font-size: 13px; border-top: 1px solid #eeeeee; }
        .code-block { background-color: #f0f4f8; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 2px; color: #2c3e50; }
        .btn { display: inline-block; background-color: #007bff; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
        p { margin-bottom: 20px; }
        .info-table { width: 100%; margin: 20px 0; border-collapse: collapse; }
        .info-table td { padding: 10px; border-bottom: 1px solid #eee; }
        .info-table td:first-child { font-weight: bold; width: 30%; color: #555; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header">
            <h1>${header}</h1>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p style="margin-bottom: 5px;">&copy; ${new Date().getFullYear()} GitLock. All rights reserved.</p>
            <p style="margin: 0;">Secure Escrow for Developers & Clients</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const sendMFAEmail = async (email, code) => {
  console.log(`[MFA OTP CODE] for ${email} is: ${code}`);

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`EMAIL_USER or EMAIL_PASS not configured. OTP displayed in console.`);
    return;
  }

  const htmlContent = `
    <p>Hello,</p>
    <p>You have requested a verification code for your GitLock account. Please use the code below to complete your login:</p>
    <div class="code-block">${code}</div>
    <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
  `;

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'GitLock Security Verification',
    html: getEmailTemplate('Security Verification', htmlContent),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`MFA Email sent to ${email}`);
  } catch (error) {
    console.warn('SMTP Email failed, proceeding with console OTP:', error.message);
  }
};

export const sendProjectInvite = async (devEmail, clientName, projectTitle, budget, subject, body) => {
  const frontendUrl = getFrontendUrl();
  const defaultBody = `
    <p>Hello,</p>
    <p><strong>${clientName}</strong> has invited you to work on a new project.</p>
    <table class="info-table">
      <tr>
        <td>Project</td>
        <td>${projectTitle}</td>
      </tr>
      <tr>
        <td>Budget</td>
        <td>${budget} tBNB</td>
      </tr>
    </table>
    <p>Please log in to your GitLock dashboard to accept or reject this invitation.</p>
    <div style="text-align: center;">
      <a href="${frontendUrl}/dashboard" class="btn">View Invitation</a>
    </div>
  `;
  
  const content = body ? `<p>${body.replace(/\n/g, '<br>')}</p>` : defaultBody;
  
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`Project invite to ${devEmail} logged (SMTP not configured).`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: devEmail,
    subject: subject || `New Project Invite: ${projectTitle}`,
    html: getEmailTemplate('Project Invitation', content)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Invite sent to ${devEmail}`);
  } catch (error) {
    console.error('Invite Email failed:', error.message);
  }
};

export const sendNotificationEmail = async (email, subject, text) => {
  const htmlBody = `<p>${text.replace(/\n/g, '<br>')}</p>`;
  
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`Notification to ${email}: ${subject} (SMTP not configured).`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: subject,
    html: getEmailTemplate('Notification', htmlBody)
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Notification Email sent to ${email}`);
  } catch (error) {
    console.error('Notification Email failed:', error.message);
  }
};

export const sendWelcomeEmail = async (email, fullName) => {
  const frontendUrl = getFrontendUrl();
  const htmlContent = `
    <p>Hello <strong>${fullName}</strong>,</p>
    <p>Welcome to <strong>GitLock</strong>! We are thrilled to have you on board.</p>
    <p>GitLock provides a secure, escrow-based environment for clients and developers to collaborate with confidence. Here is what you can do next:</p>
    <ul>
      <li>Complete your profile</li>
      <li>Create or find projects</li>
      <li>Ensure secure payments and code delivery via blockchain escrow</li>
    </ul>
    <p>If you have any questions, feel free to reply to this email.</p>
    <div style="text-align: center;">
      <a href="${frontendUrl}/dashboard" class="btn">Go to Dashboard</a>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`Welcome email to ${email} logged (SMTP not configured).`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to GitLock!',
    html: getEmailTemplate('Welcome to GitLock', htmlContent),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome Email sent to ${email}`);
  } catch (error) {
    console.error('Welcome Email failed:', error.message);
  }
};

export const sendJoinInviteEmail = async (email, clientName, projectTitle) => {
  const frontendUrl = getFrontendUrl();
  const htmlContent = `
    <p>Hello,</p>
    <p><strong>${clientName}</strong> has invited you to work on their project <strong>"${projectTitle}"</strong> on GitLock.</p>
    <p>GitLock is a secure platform for developers and clients to collaborate with blockchain escrow-based payments.</p>
    <p>To view the project details and accept the invitation, please create a developer account using the link below:</p>
    <div style="text-align: center;">
      <a href="${frontendUrl}/register?role=DEVELOPER&email=${email}" class="btn">Join GitLock</a>
    </div>
    <p>If you already have an account, please log in.</p>
  `;

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`Join invite to ${email} for "${projectTitle}" logged (SMTP not configured).`);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: email,
    subject: `Invitation to join GitLock for "${projectTitle}"`,
    html: getEmailTemplate('Project Invitation', htmlContent),
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Join Invite Email sent to ${email}`);
  } catch (error) {
    console.error('Join Invite Email failed:', error.message);
  }
};
