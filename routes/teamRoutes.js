
const express = require("express");
const router = express.Router();

const {
createTeam,
getTeams,
getTeamById,
getMissingSkills,
getRecommendedStudents,
claimLeadership,
leaveTeam,
removeMember
} = require("../controllers/teamController");

const {
checkMember,
getMessages,
sendMessage,
getResources,
shareResource
} = require("../controllers/teamCollaborationController");

const {
uploadTeamImage,
getTeamImages,
deleteTeamImage
} = require("../controllers/teamImageController");

const protect = require("../middleware/authMiddleware");

router.post("/", protect, createTeam);
router.get("/", protect, getTeams);

router.put(
"/:id/claim-leadership",
protect,
claimLeadership
);

router.get(
"/:id/missing-skills",
protect,
getMissingSkills
);

router.get(
"/:id/recommendations",
protect,
getRecommendedStudents
);

router.get(
"/:id/messages",
protect,
checkMember,
getMessages
);

router.post(
"/:id/messages",
protect,
checkMember,
sendMessage
);

router.get(
"/:id/resources",
protect,
checkMember,
getResources
);

router.post(
"/:id/resources",
protect,
checkMember,
shareResource
);

router.get(
"/:id/images",
protect,
checkMember,
getTeamImages
);

router.post(
"/:id/images",
protect,
checkMember,
uploadTeamImage
);

router.delete(
"/:id/images/:imageId",
protect,
checkMember,
deleteTeamImage
);

router.put(
"/:id/leave",
protect,
leaveTeam
);

router.delete(
"/:id/members/:memberId",
protect,
removeMember
);

router.get("/:id", protect, getTeamById);

module.exports = router;
