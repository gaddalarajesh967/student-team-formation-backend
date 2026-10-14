
const express = require("express");
const router = express.Router();

const {
registerUser,
verifyEmail,
loginUser,
forgotPassword,
resetPassword,
getProfile,
searchStudents,
updateProfile,
deleteAccount
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

// Registration - Send verification email link
router.post("/register", registerUser);

// Verify email and create MongoDB account
router.get("/verify-email", verifyEmail);

// Login
router.post("/login", loginUser);

// Forgot password - Send reset link
router.post("/forgot-password", forgotPassword);

// Reset password using email link
router.post("/reset-password", resetPassword);

// Get user profile
router.get("/profile", protect, getProfile);

// Update user profile
router.put("/profile", protect, updateProfile);

// Search students
router.get("/search", protect, searchStudents);

// Delete account - Requires login and password verification
router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
