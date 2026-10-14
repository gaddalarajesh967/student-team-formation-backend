
const nodemailer = require("nodemailer");

const createTransporter = () => {
if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
throw new Error("Email sender credentials are missing");
}

return nodemailer.createTransport({
service: "gmail",
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_APP_PASSWORD.replace(/\s/g, "")
},
connectionTimeout: 15000,
socketTimeout: 20000
});
};

const sendVerificationEmail = async (email, verificationUrl) => {
const transporter = createTransporter();

await transporter.sendMail({
from: process.env.EMAIL_USER,
to: email,
subject: "Verify Your Email - Student Team Formation",
text:
`Welcome to Student Team Formation!

Verify your email address using this link:

${verificationUrl}

This link expires in 15 minutes.

If you did not register, ignore this email.`,
html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
<h2>Student Team Formation</h2>
<p>Thank you for registering.</p>
<p>Click the button below to verify your email address.</p>
<p style="margin:30px 0">
<a href="${verificationUrl}"
style="background:#2563eb;color:white;padding:14px 22px;text-decoration:none;border-radius:8px">
Verify Your Email Address
</a>
</p>
<p>This verification link expires in 15 minutes.</p>
<p>If you did not register, you can ignore this email.</p>
</div>`
});

console.log("Verification email sent successfully to:", email);
};

const sendPasswordResetEmail = async (email, resetUrl) => {
const transporter = createTransporter();

await transporter.sendMail({
from: process.env.EMAIL_USER,
to: email,
subject: "Reset Your Password - Student Team Formation",
text:
`Click the link below to reset your password:

${resetUrl}

This link expires in 15 minutes.

If you did not request this, ignore this email.`,
html: `
<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px">
<h2>Reset Your Password</h2>
<p>Click below to set a new password.</p>
<p style="margin:30px 0">
<a href="${resetUrl}"
style="background:#2563eb;color:white;padding:14px 22px;text-decoration:none;border-radius:8px">
Reset Password
</a>
</p>
<p>This link expires in 15 minutes.</p>
</div>`
});
};

module.exports = {
sendVerificationEmail,
sendPasswordResetEmail
};
