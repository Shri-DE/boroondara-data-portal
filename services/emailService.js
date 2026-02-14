// services/emailService.js — Email sending via SMTP (nodemailer)
const nodemailer = require("nodemailer");

// SMTP configuration from environment variables
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.office365.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false, // STARTTLS on port 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM_ADDRESS = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@example.com";

/**
 * Send an email.
 * @param {{ to: string|string[], subject: string, html: string, text?: string }} options
 */
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[EMAIL] ⚠️ SMTP not configured — set SMTP_USER and SMTP_PASS environment variables");
    console.log("[EMAIL] Would have sent to:", Array.isArray(to) ? to.join(", ") : to);
    console.log("[EMAIL] Subject:", subject);
    return null;
  }

  console.log("[EMAIL] Sending to:", Array.isArray(to) ? to.join(", ") : to, "| Subject:", subject);

  try {
    const info = await transporter.sendMail({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      text: text || "",
      html,
    });

    console.log("[EMAIL] ✅ Sent successfully:", info.messageId);
    return info;
  } catch (err) {
    console.error("[EMAIL] ❌ Failed to send:", err.message);
    throw err;
  }
}

module.exports = { sendEmail };
