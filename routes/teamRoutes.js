const express = require("express");
const router = express.Router();

const {
createTeam,
getTeams,
getTeamById,
getMissingSkills,
getRecommendedStudents,
leaveTeam,
removeMember
} = require("../controllers/teamController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createTeam);

router.get("/", protect, getTeams);

router.get("/:id/missing-skills", protect, getMissingSkills);

router.get("/:id/recommendations", protect, getRecommendedStudents);

router.put("/:id/leave", protect, leaveTeam);

router.delete("/:id/members/:memberId", protect, removeMember);

router.get("/:id", protect, getTeamById);

module.exports = router;