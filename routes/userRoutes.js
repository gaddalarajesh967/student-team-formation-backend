
const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  searchStudents,
  updateProfile,
  deleteAccount
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

router.post("/register", registerUser);

router.post("/login", loginUser);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

router.get("/profile", protect, getProfile);

router.put("/profile", protect, updateProfile);

router.get("/search", protect, searchStudents);

router.delete("/delete-account", protect, deleteAccount);

module.exports = router;
