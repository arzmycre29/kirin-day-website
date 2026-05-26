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

function buildHtmlEmail({ title, subtitle, buyerName, mainText, detailsHtml, ctaUrl, ctaText }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f7f9fc;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f7f9fc;
      padding: 20px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #eef2f6;
    }
    .header {
      background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%);
      padding: 30px 20px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 1px;
      color: #e0f2fe;
    }
    .header p {
      margin: 5px 0 0 0;
      font-size: 14px;
      color: #c084fc;
      font-weight: 500;
    }
    .content {
      padding: 30px 25px;
      color: #334155;
    }
    .content h2 {
      font-size: 18px;
      margin-top: 0;
      color: #0f172a;
    }
    .main-text {
      font-size: 15px;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 25px;
    }
    .details-box {
      background-color: #f8fafc;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 25px;
      border: 1px solid #f1f5f9;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 10px 0;
    }
    .btn {
      display: inline-block;
      background-color: #7c3aed;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 30px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 4px 6px rgba(124, 58, 237, 0.15);
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid #eef2f6;
    }
    .footer p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>KIRIN DAY</h1>
        <p>${subtitle}</p>
      </div>
      <div class="content">
        <h2>Halo ${buyerName},</h2>
        <div class="main-text">
          ${mainText}
        </div>
        ${detailsHtml ? `
        <div class="details-box">
          ${detailsHtml}
        </div>
        ` : ''}
        ${ctaUrl ? `
        <div class="cta-container">
          <a href="${ctaUrl}" class="btn" target="_blank">${ctaText || 'Cek Detail'}</a>
        </div>
        ` : ''}
      </div>
      <div class="footer">
        <p>&copy; ${new Date().getFullYear()} Kirin Day Management. All rights reserved.</p>
        <p>Butuh bantuan? Balas email ini atau hubungi kami melalui WhatsApp.</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail({ to, subject, body, html }) {
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
          htmlContent: html || body.replace(/\n/g, '<br>') // Use beautiful html if provided, otherwise convert newlines to HTML br
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
    if (html) {
      console.log(`HTML Body:\n${html}`);
    } else {
      console.log(`Plain Body:\n${body}`);
    }
    console.log("===================================================");
    return { mock: true, messageId: `mock-${Date.now()}` };
  }
}

module.exports = { sendEmail, buildHtmlEmail };

