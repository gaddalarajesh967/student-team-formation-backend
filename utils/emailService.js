const RESEND_API_URL = "https://api.resend.com/emails";

const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "onboarding@resend.dev";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is missing");
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    console.error("Resend API error:", result);
    throw new Error(
      result.message ||
        result.error ||
        `Email sending failed with status ${response.status}`
    );
  }

  console.log("Email accepted by Resend:", result.id);
  return result;
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const sendVerificationEmail = async (email, verificationUrl) => {
  const safeUrl = escapeHtml(verificationUrl);

  return sendEmail({
    to: email,
    subject: "Verify Your Email - Student Team Formation",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#1f2937">
        <h2 style="color:#2563eb">Verify Your Email</h2>
        <p>Thank you for registering with Student Team Formation.</p>
        <p>Please click below to verify your email address.</p>
        <p style="margin:24px 0">
          <a href="${safeUrl}"
             style="background:#2563eb;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">
            Verify Email
          </a>
        </p>
        <p>This verification link expires in 15 minutes.</p>
        <p>If you did not create this account, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="font-size:12px;color:#6b7280">Student Team Formation</p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, resetUrl) => {
  const safeUrl = escapeHtml(resetUrl);

  return sendEmail({
    to: email,
    subject: "Password Reset - Student Team Formation",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;color:#1f2937">
        <h2 style="color:#2563eb">Reset Your Password</h2>
        <p>We received a request to reset your password.</p>
        <p>Click below to reset your password.</p>
        <p style="margin:24px 0">
          <a href="${safeUrl}"
             style="background:#2563eb;color:#ffffff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block">
            Reset Password
          </a>
        </p>
        <p>This password reset link expires in 15 minutes.</p>
        <p>If you did not request a password reset, you can ignore this email.</p>
        <hr style="border:none;border-top:1px solid #e5e7eb">
        <p style="font-size:12px;color:#6b7280">Student Team Formation</p>
      </div>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};