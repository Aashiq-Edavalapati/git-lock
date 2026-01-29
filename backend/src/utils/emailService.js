import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendMFAEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'GitLock Security Verification',
    text: `Your Verification Code is: ${code}. It expires in 10 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ MFA Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Email failed:', error);
    throw new Error('Email service failed');
  }
};

export const sendProjectInvite = async (devEmail, clientName, projectTitle, budget, subject, body) => {
  const defaultSubject = `New Project Invite: ${projectTitle}`;
  const defaultBody = `Hello,\n\n${clientName} has invited you to work on "${projectTitle}" with a budget of $${budget}.\n\nPlease log in to GitLock to accept or reject this project.\n\n- The GitLock Team`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: devEmail,
    subject: subject || defaultSubject,
    text: body || defaultBody
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Invite sent to ${devEmail}`);
  } catch (error) {
    console.error('❌ Invite Email failed:', error);
  }
};

export const sendNotificationEmail = async (email, subject, text) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification Email sent to ${email}`);
  } catch (error) {
    console.error('❌ Notification Email failed:', error);
  }
};