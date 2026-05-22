// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT || 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

let transporter = null;

if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort, 10),
    secure: parseInt(smtpPort, 10) === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log("SMTP Mailer configured successfully.");
} else {
  console.warn("SMTP credentials missing. Emails will be logged to console instead of sent.");
}

async function sendEmail({ to, subject, body }) {
  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"Kirin Day Support" <${smtpUser}>`,
        to,
        subject,
        html: body.replace(/\n/g, '<br>') // Convert newlines to HTML br tags for standard body formatting
      });
      console.log(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`Failed to send email to ${to}:`, err);
      return null;
    }
  } else {
    console.log("================= MOCK EMAIL SEND =================");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${body}`);
    console.log("===================================================");
    return { mock: true, messageId: `mock-${Date.now()}` };
  }
}

module.exports = { sendEmail };
