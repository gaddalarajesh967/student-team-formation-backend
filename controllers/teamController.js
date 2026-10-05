const Team = require("../models/Team");
const User = require("../models/User");

const createTeam = async (req, res) => {
try {

const {
teamName,
projectTitle,
projectDescription,
requiredSkills,
maxMembers
} = req.body;

if (!teamName || !projectTitle) {
return res.status(400).json({
message: "Team name and project title are required"
});
}

const team = await Team.create({
teamName,
projectTitle,
projectDescription,
requiredSkills,
maxMembers,
leader: req.user._id,
members: [req.user._id]
});

res.status(201).json({
message: "Team created successfully",
team: team
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const getTeams = async (req, res) => {
try {

const teams = await Team.find()
.populate("leader", "name email branch year skills")
.populate("members", "name email branch year skills");

res.status(200).json({
message: "Teams fetched successfully",
count: teams.length,
teams: teams
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const getTeamById = async (req, res) => {
try {

const team = await Team.findById(req.params.id)
.populate("leader", "name email branch year skills interests availability experience")
.populate("members", "name email branch year skills interests availability experience");

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

res.status(200).json({
message: "Team fetched successfully",
team: team
});

} catch (error) {

res.status(500).json({
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

const memberSkills = [];

team.members.forEach((member) => {

member.skills.forEach((skill) => {

memberSkills.push(skill.toLowerCase());

});

});

const missingSkills = team.requiredSkills.filter((skill) => {

return !memberSkills.includes(skill.toLowerCase());

});

res.status(200).json({
message: "Missing skills fetched successfully",
teamName: team.teamName,
requiredSkills: team.requiredSkills,
missingSkills: missingSkills
});

} catch (error) {

res.status(500).json({
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

team.members.forEach((member) => {

member.skills.forEach((skill) => {

memberSkills.push(skill.toLowerCase());

});

member.interests.forEach((interest) => {

teamInterests.push(interest.toLowerCase());

});

});

const missingSkills = team.requiredSkills.filter((skill) => {

return !memberSkills.includes(skill.toLowerCase());

});

if (missingSkills.length === 0) {

return res.status(200).json({
message: "No missing skills. Team has all required skills",
teamName: team.teamName,
missingSkills: [],
count: 0,
recommendedStudents: []
});

}

const memberIds = team.members.map((member) => {

return member._id;

});

const users = await User.find({
_id: {
$nin: memberIds
},
availability: true
}).select("-password");

const recommendations = [];

users.forEach((user) => {

const userSkills = user.skills.map((skill) => {

return skill.toLowerCase();

});

const userInterests = user.interests.map((interest) => {

return interest.toLowerCase();

});

const matchedSkills = missingSkills.filter((skill) => {

return userSkills.includes(skill.toLowerCase());

});

if (matchedSkills.length === 0) {

return;

}

const skillScore = Math.round(
(matchedSkills.length / missingSkills.length) * 60
);

const matchedInterests = userInterests.filter((interest) => {

return teamInterests.includes(interest);

});

let interestScore = 0;

if (matchedInterests.length > 0) {

interestScore = 20;

}

let experienceScore = 0;

if (user.experience === "Beginner") {

experienceScore = 5;

}

if (user.experience === "Intermediate") {

experienceScore = 15;

}

if (user.experience === "Advanced") {

experienceScore = 20;

}

const compatibilityScore =
skillScore +
interestScore +
experienceScore;

const reason =
`Matches ${matchedSkills.join(", ")}. ` +
`Experience: ${user.experience}. ` +
`Availability: Available.`;

recommendations.push({
student: user,
matchedSkills: matchedSkills,
matchedInterests: matchedInterests,
skillScore: skillScore,
interestScore: interestScore,
experienceScore: experienceScore,
compatibilityScore: compatibilityScore,
reason: reason
});

});

recommendations.sort((a, b) => {

return b.compatibilityScore - a.compatibilityScore;

});

res.status(200).json({
message: "Recommended students fetched successfully",
teamName: team.teamName,
missingSkills: missingSkills,
count: recommendations.length,
recommendedStudents: recommendations
});

} catch (error) {

res.status(500).json({
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

const isMember = team.members.some((memberId) => {

return memberId.toString() === req.user._id.toString();

});

if (!isMember) {
return res.status(400).json({
message: "You are not a member of this team"
});
}

if (team.leader.toString() === req.user._id.toString()) {
return res.status(400).json({
message: "Team leader cannot leave the team"
});
}

team.members = team.members.filter((memberId) => {

return memberId.toString() !== req.user._id.toString();

});

await team.save();

res.status(200).json({
message: "You left the team successfully",
team: team
});

} catch (error) {

res.status(500).json({
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

if (team.leader.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "Only team leader can remove members"
});
}

const memberId = req.params.memberId;

if (memberId === req.user._id.toString()) {
return res.status(400).json({
message: "Team leader cannot remove themselves"
});
}

const isMember = team.members.some((id) => {

return id.toString() === memberId;

});

if (!isMember) {
return res.status(404).json({
message: "Student is not a member of this team"
});
}

team.members = team.members.filter((id) => {

return id.toString() !== memberId;

});

await team.save();

res.status(200).json({
message: "Member removed successfully",
team: team
});

} catch (error) {

res.status(500).json({
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
leaveTeam,
removeMember
};