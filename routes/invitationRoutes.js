const express = require("express");
const router = express.Router();

const {
sendInvitation,
getMyInvitations,
acceptInvitation,
rejectInvitation
} = require("../controllers/invitationController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, sendInvitation);
router.get("/my", protect, getMyInvitations);
router.put("/:id/accept", protect, acceptInvitation);
router.put("/:id/reject", protect, rejectInvitation);

module.exports = router;