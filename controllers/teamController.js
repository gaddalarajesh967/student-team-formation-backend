
const mongoose = require("mongoose");
const Team = require("../models/Team");
const User = require("../models/User");

const normalizeSkill = value =>
String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const relatedSkills = {
flutter: [
"dart", "android", "android development",
"mobile development", "mobile app development",
"react native", "kotlin"
],
react: [
"javascript", "typescript", "frontend",
"frontend development", "html", "css", "next.js"
],
"node.js": [
"javascript", "express", "express.js",
"backend", "backend development", "typescript"
],
"machine learning": [
"python", "tensorflow", "scikit-learn",
"pandas", "pytorch", "data science"
],
python: [
"django", "flask", "fastapi",
"data science", "machine learning"
],
mongodb: [
"mongoose", "nosql", "database",
"database management"
],
java: [
"spring boot", "spring", "android",
"backend development"
],
"web development": [
"html", "css", "javascript", "react",
"node.js", "frontend development"
]
};

const findSkillMatch = (requiredSkill, studentSkills) => {
const required = normalizeSkill(requiredSkill);
const normalized = studentSkills.map(normalizeSkill);

if (normalized.includes(required)) {
return {
type: "Exact",
matchedSkill: requiredSkill,
weight: 1
};
}

const related = relatedSkills[required] || [];
const match = related.find(skill =>
normalized.includes(normalizeSkill(skill))
);

if (match) {
return {
type: "Related",
matchedSkill: match,
weight: 0.5
};
}

return null;
};

const createTeam = async (req, res) => {
try {
console.log("UPDATED CREATE TEAM FUNCTION RUNNING");

const userId = req.user._id;

const currentUser = await User.findById(userId);

if (!currentUser) {
return res.status(404).json({
message: "User account not found"
});
}

const existingTeam = await Team.findOne({
$or: [
{ members: userId },
{ leader: userId },
{ createdBy: userId }
]
});

if (existingTeam) {
return res.status(409).json({
message: "You already belong to a team. Cannot create another team.",
existingTeamId: existingTeam._id,
existingTeamName: existingTeam.teamName
});
}

const {
teamName,
projectTitle,
projectDescription = "",
requiredSkills = [],
maxMembers = 4,
creationRole = "leader"
} = req.body;

if (
typeof teamName !== "string" ||
!teamName.trim() ||
typeof projectTitle !== "string" ||
!projectTitle.trim()
) {
return res.status(400).json({
message: "Team name and project title are required"
});
}

if (!["leader", "member"].includes(creationRole)) {
return res.status(400).json({
message: "Invalid creation role"
});
}

const capacity = Number(maxMembers);

if (
!Number.isInteger(capacity) ||
capacity < 2 ||
capacity > 20
) {
return res.status(400).json({
message: "Maximum members must be between 2 and 20"
});
}

const isLeader = creationRole === "leader";

const team = await Team.create({
teamName: teamName.trim(),
projectTitle: projectTitle.trim(),
projectDescription,
requiredSkills: Array.isArray(requiredSkills)
? requiredSkills.map(String).map(s => s.trim()).filter(Boolean)
: [],
maxMembers: capacity,
leader: isLeader ? userId : null,
createdBy: userId,
formationType: isLeader
? "LeaderCreated"
: "MemberCreated",
members: [userId],
status: isLeader ? "Open" : "PendingLeader"
});

return res.status(201).json({
message: isLeader
? "Team created successfully. You are the leader."
: "Team created successfully as a member. Waiting for a leader.",
team
});

} catch (error) {
console.error("Create team error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const getTeams = async (req, res) => {
try {
const teams = await Team.find()
.populate("leader", "name email branch year skills")
.populate("createdBy", "name email")
.populate("members", "name email branch year skills")
.sort({ createdAt: -1 });

return res.status(200).json({
message: "Teams fetched successfully",
count: teams.length,
teams
});

} catch (error) {
console.error("Get teams error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const getTeamById = async (req, res) => {
try {
if (!mongoose.isValidObjectId(req.params.id)) {
return res.status(400).json({
message: "Invalid team ID"
});
}

const team = await Team.findById(req.params.id)
.populate(
"leader",
"name email branch year skills interests availability experience"
)
.populate("createdBy", "name email")
.populate(
"members",
"name email branch year skills interests availability experience"
);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

return res.status(200).json({
message: "Team fetched successfully",
team
});

} catch (error) {
console.error("Get team error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const getMissingSkills = async (req, res) => {
try {
const team = await Team.findById(req.params.id)
.populate("members", "skills");

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

const memberSkills = new Set();

team.members.forEach(member => {
if (!member) return;

(member.skills || []).forEach(skill => {
memberSkills.add(normalizeSkill(skill));
});
});

const missingSkills = (team.requiredSkills || [])
.filter(skill => !memberSkills.has(normalizeSkill(skill)));

return res.status(200).json({
message: "Missing skills fetched successfully",
teamName: team.teamName,
requiredSkills: team.requiredSkills,
missingSkills
});

} catch (error) {
console.error("Missing skills error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const getRecommendedStudents = async (req, res) => {
try {
const team = await Team.findById(req.params.id)
.populate("members", "skills interests");

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

const memberSkills = [];
const teamInterests = [];

team.members.forEach(member => {
if (!member) return;

(member.skills || []).forEach(skill => {
memberSkills.push(normalizeSkill(skill));
});

(member.interests || []).forEach(interest => {
teamInterests.push(normalizeSkill(interest));
});
});

const missingSkills = (team.requiredSkills || [])
.filter(skill => !memberSkills.includes(normalizeSkill(skill)));

if (missingSkills.length === 0) {
return res.status(200).json({
message: "No missing skills. Team has all required skills",
teamName: team.teamName,
missingSkills: [],
count: 0,
recommendedStudents: []
});
}

const memberIds = team.members
.filter(Boolean)
.map(member => member._id);

const users = await User.find({
_id: { $nin: memberIds },
availability: true
}).select("-password");

const recommendations = [];

users.forEach(user => {
const userSkills = user.skills || [];
const userInterests = (user.interests || []).map(normalizeSkill);

const matchedSkills = [];
const relatedMatchedSkills = [];

let weightedSkillMatches = 0;

missingSkills.forEach(requiredSkill => {
const match = findSkillMatch(requiredSkill, userSkills);

if (!match) return;

weightedSkillMatches += match.weight;

if (match.type === "Exact") {
matchedSkills.push(requiredSkill);
} else {
relatedMatchedSkills.push({
requiredSkill,
studentSkill: match.matchedSkill
});
}
});

if (weightedSkillMatches === 0) return;

const skillScore = Math.round(
(weightedSkillMatches / missingSkills.length) * 60
);

const matchedInterests = userInterests.filter(interest =>
teamInterests.includes(interest)
);

const interestScore = matchedInterests.length > 0 ? 20 : 0;

const experienceScore = {
Beginner: 5,
Intermediate: 15,
Advanced: 20
}[user.experience] || 0;

const compatibilityScore =
skillScore + interestScore + experienceScore;

const reasonParts = [];

if (matchedSkills.length) {
reasonParts.push("Exact skills: " + matchedSkills.join(", "));
}

if (relatedMatchedSkills.length) {
reasonParts.push(
"Related skills: " +
relatedMatchedSkills.map(item =>
`${item.studentSkill} for ${item.requiredSkill}`
).join(", ")
);
}

reasonParts.push(
"Experience: " + (user.experience || "Not specified")
);

reasonParts.push("Availability: Available");

recommendations.push({
student: user,
matchedSkills,
relatedMatchedSkills,
matchedInterests,
skillScore,
interestScore,
experienceScore,
compatibilityScore,
score: compatibilityScore,
reason: reasonParts.join(". ") + "."
});
});

recommendations.sort(
(a, b) => b.compatibilityScore - a.compatibilityScore
);

return res.status(200).json({
message: "Recommended students fetched successfully",
teamName: team.teamName,
missingSkills,
count: recommendations.length,
recommendedStudents: recommendations
});

} catch (error) {
console.error("Recommendations error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const claimLeadership = async (req, res) => {
try {
const teamId = req.params.id;
const userId = req.user._id;

if (!mongoose.isValidObjectId(teamId)) {
return res.status(400).json({
message: "Invalid team ID"
});
}

const existingMembership = await Team.findOne({
_id: { $ne: teamId },
$or: [
{ members: userId },
{ leader: userId },
{ createdBy: userId }
]
});

if (existingMembership) {
return res.status(409).json({
message: "You already belong to another team. Cannot claim leadership."
});
}

const team = await Team.findOneAndUpdate(
{
_id: teamId,
leader: null,
status: "PendingLeader"
},
{
$set: {
leader: userId,
status: "Open"
},
$addToSet: {
members: userId
}
},
{ new: true }
);

if (!team) {
return res.status(400).json({
message: "Team is not available for leadership"
});
}

return res.status(200).json({
message: "You are now the team leader",
team
});

} catch (error) {
console.error("Claim leadership error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const leaveTeam = async (req, res) => {
try {
const team = await Team.findById(req.params.id);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

const userId = req.user._id.toString();

const isMember = team.members.some(
id => id.toString() === userId
);

if (!isMember) {
return res.status(400).json({
message: "You are not a member of this team"
});
}

if (team.leader && team.leader.toString() === userId) {
return res.status(400).json({
message: "Team leader cannot leave the team"
});
}

team.members = team.members.filter(
id => id.toString() !== userId
);

if (team.members.length === 0) {
await Team.findByIdAndDelete(team._id);

return res.status(200).json({
message: "You left the team. Empty team deleted."
});
}

team.status = team.leader ? "Open" : "PendingLeader";

await team.save();

return res.status(200).json({
message: "You left the team successfully",
team
});

} catch (error) {
console.error("Leave team error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

const removeMember = async (req, res) => {
try {
const team = await Team.findById(req.params.id);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

if (
!team.leader ||
team.leader.toString() !== req.user._id.toString()
) {
return res.status(403).json({
message: "Only team leader can remove members"
});
}

const memberId = req.params.memberId;

if (!mongoose.isValidObjectId(memberId)) {
return res.status(400).json({
message: "Invalid member ID"
});
}

if (memberId === req.user._id.toString()) {
return res.status(400).json({
message: "Team leader cannot remove themselves"
});
}

const isMember = team.members.some(
id => id.toString() === memberId
);

if (!isMember) {
return res.status(404).json({
message: "Student is not a member of this team"
});
}

team.members = team.members.filter(
id => id.toString() !== memberId
);

if (team.status === "Full") {
team.status = "Open";
}

await team.save();

return res.status(200).json({
message: "Member removed successfully",
team
});

} catch (error) {
console.error("Remove member error:", error);

return res.status(500).json({
message: "Server error",
error: error.message
});
}
};

module.exports = {
createTeam,
getTeams,
getTeamById,
getMissingSkills,
getRecommendedStudents,
claimLeadership,
leaveTeam,
removeMember
};
