// Cwd: d:/ProjectApp/Kirin Day Web/api/orders/email.js
require('dotenv').config();

const brevoApiKey = process.env.BREVO_API_KEY;
const brevoSenderEmail = process.env.BREVO_SENDER_EMAIL;

const isBrevoConfigured = brevoApiKey && brevoApiKey.startsWith('xkeysib-') && !brevoApiKey.includes('your_brevo_api_key') && brevoSenderEmail;

if (isBrevoConfigured) {
  console.log("Brevo Mailer configured successfully.");
} else {
  console.warn("BREVO_API_KEY or BREVO_SENDER_EMAIL missing or invalid. Emails will be logged to console (Mock Mailer).");
}

async function sendEmail({ to, subject, body }) {
  if (isBrevoConfigured) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: "Kirin Day Support",
            email: brevoSenderEmail
          },
          to: [
            {
              email: to
            }
          ],
          subject: subject,
          htmlContent: body.replace(/\n/g, '<br>') // Convert newlines to HTML br tags for standard body formatting
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      console.log(`Email sent to ${to}: ${data.messageId}`);
      return { messageId: data.messageId };
    } catch (err) {
      console.error(`Failed to send email to ${to} via Brevo:`, err);
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
