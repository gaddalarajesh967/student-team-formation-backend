
const User = require("../models/User");
const PendingRegistration = require("../models/PendingRegistration");
const Team = require("../models/Team");
const Invitation = require("../models/Invitation");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const {
sendVerificationEmail,
sendPasswordResetEmail
} = require("../utils/emailService");

const LINK_EXPIRY = 15 * 60 * 1000;
const RESEND_COOLDOWN = 60 * 1000;

const normalizeEmail = value =>
String(value || "").trim().toLowerCase();

const generateToken = () =>
crypto.randomBytes(32).toString("hex");

const hashToken = token =>
crypto.createHash("sha256").update(token).digest("hex");

const getFrontendUrl = () =>
process.env.FRONTEND_URL || "http://localhost:5173";

const getBackendUrl = () =>
process.env.BACKEND_URL || "http://localhost:5000";

const formatUser = user => ({
_id: user._id,
id: user._id,
name: user.name,
email: user.email,
branch: user.branch,
year: user.year,
skills: user.skills,
interests: user.interests,
availability: user.availability,
experience: user.experience,
profilePhoto: user.profilePhoto || "",
isEmailVerified: user.isEmailVerified
});


const registerUser = async (req, res) => {
  try {
    const {
      name,
      password,
      branch,
      year,
      skills,
      interests,
      availability,
      experience
    } = req.body;

    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password || !branch || !year) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        message: "Please enter a valid email address"
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters"
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: "Email already registered. Please login."
      });
    }

    const existingPending = await PendingRegistration.findOne({ email });

    if (
      existingPending &&
      existingPending.verificationLastSentAt &&
      Date.now() -
        new Date(existingPending.verificationLastSentAt).getTime() <
        RESEND_COOLDOWN
    ) {
      return res.status(429).json({
        message: "Please wait 60 seconds before requesting another verification email"
      });
    }

    const verificationToken = generateToken();
    const verificationTokenHash = hashToken(verificationToken);

    const verificationUrl =
      `${getBackendUrl()}/api/users/verify-email?token=${verificationToken}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    await PendingRegistration.findOneAndUpdate(
      { email },
      {
        $set: {
          name: String(name).trim(),
          email,
          password: hashedPassword,
          branch,
          year: Number(year),
          skills: Array.isArray(skills) ? skills : [],
          interests: Array.isArray(interests) ? interests : [],
          availability: typeof availability === "boolean" ? availability : true,
          experience: experience || "Beginner",
          verificationTokenHash,
          verificationExpiresAt: new Date(Date.now() + LINK_EXPIRY),
          verificationLastSentAt: new Date(),
          expiresAt: new Date(Date.now() + LINK_EXPIRY)
        }
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true
      }
    );

    await sendVerificationEmail(email, verificationUrl);

    return res.status(200).json({
      message: "Verification email sent successfully. Please check your inbox.",
      email,
      requiresVerification: true
    });
  } catch (error) {
    console.error("Registration verification error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Email already registered. Please login."
      });
    }

    return res.status(500).json({
      message: "Unable to send verification email. Please try again."
    });
  }
};

// VERIFY EMAIL

const verifyEmail = async (req, res) => {
try {
const token = String(req.query.token || "");

if (!/^[a-f0-9]{64}$/.test(token)) {
return res.redirect(
`${getFrontendUrl()}/?verification=invalid`
);
}

const pending = await PendingRegistration.findOne({
verificationTokenHash: hashToken(token),
verificationExpiresAt: {
$gt: new Date()
}
}).select("+verificationTokenHash");

if (!pending) {
return res.redirect(
`${getFrontendUrl()}/?verification=invalid`
);
}

const existingUser = await User.findOne({
email: pending.email
});

if (existingUser) {
await PendingRegistration.deleteOne({
_id: pending._id
});

return res.redirect(
`${getFrontendUrl()}/?verification=already`
);
}

await User.create({
name: pending.name,
email: pending.email,
password: pending.password,
branch: pending.branch,
year: pending.year,
skills: pending.skills,
interests: pending.interests,
availability: pending.availability,
experience: pending.experience,
profilePhoto: "",
isEmailVerified: true
});

await PendingRegistration.deleteOne({
_id: pending._id
});

return res.redirect(
`${getFrontendUrl()}/?verification=success`
);

} catch (error) {
console.error("Email verification error:", error);

return res.redirect(
`${getFrontendUrl()}/?verification=error`
);
}
};

// LOGIN USER

const loginUser = async (req, res) => {
try {
const email = normalizeEmail(req.body.email);
const { password } = req.body;

if (!email || !password) {
return res.status(400).json({
message: "Email and password are required"
});
}

const user = await User.findOne({ email });

if (!user) {
return res.status(401).json({
message: "Invalid email or password"
});
}

const isPasswordValid = await bcrypt.compare(
password,
user.password
);

if (!isPasswordValid) {
return res.status(401).json({
message: "Invalid email or password"
});
}

if (user.isEmailVerified === false) {
return res.status(403).json({
message: "Please verify your email address before login"
});
}

const token = jwt.sign(
{ id: user._id },
process.env.JWT_SECRET,
{ expiresIn: "7d" }
);

return res.status(200).json({
message: "Login successful",
token,
user: formatUser(user)
});

} catch (error) {
console.error("Login error:", error);

return res.status(500).json({
message: "Login failed"
});
}
};

// FORGOT PASSWORD

const forgotPassword = async (req, res) => {
try {
const email = normalizeEmail(req.body.email);

if (!email) {
return res.status(400).json({
message: "Email is required"
});
}

const message =
"If this email is registered, a password reset link will be sent.";

const user = await User.findOne({ email });

if (!user) {
return res.status(200).json({ message });
}

const resetToken = generateToken();

user.resetTokenHash = hashToken(resetToken);
user.resetTokenExpiresAt =
new Date(Date.now() + LINK_EXPIRY);

await user.save();

const resetUrl =
`${getFrontendUrl()}/?resetToken=${resetToken}`;

await sendPasswordResetEmail(email, resetUrl);

return res.status(200).json({ message });

} catch (error) {
console.error("Forgot password error:", error);

return res.status(500).json({
message: "Unable to send password reset email"
});
}
};

// RESET PASSWORD

const resetPassword = async (req, res) => {
try {
const token = String(req.body.token || "");
const { newPassword } = req.body;

if (!/^[a-f0-9]{64}$/.test(token)) {
return res.status(400).json({
message: "Invalid reset token"
});
}

if (
typeof newPassword !== "string" ||
newPassword.length < 8
) {
return res.status(400).json({
message: "New password must be at least 8 characters"
});
}

const user = await User.findOne({
resetTokenHash: hashToken(token),
resetTokenExpiresAt: {
$gt: new Date()
}
}).select("+resetTokenHash +resetTokenExpiresAt");

if (!user) {
return res.status(400).json({
message: "Password reset link is invalid or expired"
});
}

user.password = await bcrypt.hash(newPassword, 10);
user.resetTokenHash = undefined;
user.resetTokenExpiresAt = undefined;

await user.save();

return res.status(200).json({
message: "Password reset successfully. Please login."
});

} catch (error) {
console.error("Reset password error:", error);

return res.status(500).json({
message: "Unable to reset password"
});
}
};

// GET PROFILE

const getProfile = async (req, res) => {
try {
const user = await User.findById(req.user._id)
.select("-password -resetTokenHash -resetTokenExpiresAt");

if (!user) {
return res.status(404).json({
message: "User not found"
});
}

return res.status(200).json({
message: "Profile fetched successfully",
user
});

} catch (error) {
console.error("Get profile error:", error);

return res.status(500).json({
message: "Unable to fetch profile"
});
}
};

// SEARCH STUDENTS

const searchStudents = async (req, res) => {
try {
const {
name,
email,
skill,
branch,
year,
availability,
experience,
search
} = req.query;

const filter = {};

const escapeRegex = value =>
String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

if (search && String(search).trim()) {
const keyword = escapeRegex(String(search).trim());

filter.$or = [
{ name: { $regex: keyword, $options: "i" } },
{ email: { $regex: keyword, $options: "i" } },
{ branch: { $regex: keyword, $options: "i" } },
{ skills: { $regex: keyword, $options: "i" } },
{ interests: { $regex: keyword, $options: "i" } }
];
}

if (name && String(name).trim()) {
filter.name = {
$regex: escapeRegex(String(name).trim()),
$options: "i"
};
}

if (email && String(email).trim()) {
filter.email = {
$regex: escapeRegex(String(email).trim()),
$options: "i"
};
}

if (skill && String(skill).trim()) {
filter.skills = {
$regex: escapeRegex(String(skill).trim()),
$options: "i"
};
}

if (branch && String(branch).trim()) {
filter.branch = {
$regex: `^${escapeRegex(String(branch).trim())}$`,
$options: "i"
};
}

if (year !== undefined && String(year).trim() !== "") {
const parsedYear = Number(year);

if (!Number.isInteger(parsedYear)) {
return res.status(400).json({
message: "Invalid year"
});
}

filter.year = parsedYear;
}

if (
availability !== undefined &&
String(availability).trim() !== "" &&
String(availability).toLowerCase() !== "all"
) {
const value = String(availability).toLowerCase();

if (value !== "true" && value !== "false") {
return res.status(400).json({
message: "Availability must be true, false or all"
});
}

filter.availability = value === "true";
}

if (experience && String(experience).trim()) {
filter.experience = {
$regex: `^${escapeRegex(String(experience).trim())}$`,
$options: "i"
};
}

const students = await User.find(filter)
.select("-password -resetTokenHash -resetTokenExpiresAt")
.sort({ name: 1 })
.lean();

return res.status(200).json({
message: "Students fetched successfully",
count: students.length,
students
});

} catch (error) {
console.error("Student search error:", error);

return res.status(500).json({
message: "Unable to search students"
});
}
};

// UPDATE PROFILE

const updateProfile = async (req, res) => {
try {
const user = await User.findById(req.user._id);

if (!user) {
return res.status(404).json({
message: "User not found"
});
}

if (req.body.profilePhoto !== undefined) {
const photo = req.body.profilePhoto;

if (
typeof photo !== "string" ||
(
photo !== "" &&
!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(photo)
)
) {
return res.status(400).json({
message: "Invalid profile photo format"
});
}

if (Buffer.byteLength(photo, "utf8") > 1400000) {
return res.status(400).json({
message: "Profile photo is too large"
});
}
}

const allowedFields = [
"name",
"branch",
"year",
"skills",
"interests",
"availability",
"experience",
"profilePhoto"
];

for (const field of allowedFields) {
if (req.body[field] !== undefined) {
user[field] = req.body[field];
}
}

await user.save();

return res.status(200).json({
message: "Profile updated successfully",
user: formatUser(user)
});

} catch (error) {
console.error("Profile update error:", error);

return res.status(500).json({
message: "Unable to update profile"
});
}
};

// DELETE ACCOUNT

const deleteAccount = async (req, res) => {
try {
const email = normalizeEmail(req.body?.email);
const password = req.body?.password;

if (!email || typeof password !== "string" || !password) {
return res.status(400).json({
message: "Registered email and password are required"
});
}

const user = await User.findById(req.user._id)
.select("+password");

if (!user) {
return res.status(404).json({
message: "User not found"
});
}

if (normalizeEmail(user.email) !== email) {
return res.status(401).json({
message: "Email or password is incorrect"
});
}

const passwordValid = await bcrypt.compare(
password,
user.password
);

if (!passwordValid) {
return res.status(401).json({
message: "Email or password is incorrect"
});
}

// Prevent deletion if user owns any teams.
const ownedTeam = await Team.findOne({
leader: user._id
}).select("_id");

if (ownedTeam) {
return res.status(409).json({
message:
"You are the leader of one or more teams. Transfer or delete those teams before deleting your account."
});
}

// Remove user from teams where they are a member.
await Team.updateMany(
{ members: user._id },
{ $pull: { members: user._id } }
);

// Delete invitations sent or received by this user.
await Invitation.deleteMany({
$or: [
{ sender: user._id },
{ receiver: user._id }
]
});

// Delete user account.
await User.deleteOne({
_id: user._id
});

return res.status(200).json({
message: "Account deleted successfully"
});

} catch (error) {
console.error("Delete account error:", error);

return res.status(500).json({
message: "Unable to delete account"
});
}
};

// EXPORT CONTROLLERS

module.exports = {
registerUser,
verifyEmail,
loginUser,
forgotPassword,
resetPassword,
getProfile,
searchStudents,
updateProfile,
deleteAccount
};
