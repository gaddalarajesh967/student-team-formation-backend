const Invitation = require("../models/Invitation");
const Team = require("../models/Team");
const User = require("../models/User");

const sendInvitation = async (req, res) => {
try {

const {
teamId,
receiverId
} = req.body;

if (!teamId || !receiverId) {
return res.status(400).json({
message: "Team ID and receiver ID are required"
});
}

const team = await Team.findById(teamId);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

if (team.leader.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "Only team leader can send invitations"
});
}

const receiver = await User.findById(receiverId);

if (!receiver) {
return res.status(404).json({
message: "Student not found"
});
}

const alreadyMember = team.members.some((memberId) => {
return memberId.toString() === receiverId.toString();
});

if (alreadyMember) {
return res.status(400).json({
message: "Student is already a team member"
});
}

if (team.members.length >= team.maxMembers) {
return res.status(400).json({
message: "Team is already full"
});
}

const existingInvitation = await Invitation.findOne({
team: teamId,
receiver: receiverId,
status: "Pending"
});

if (existingInvitation) {
return res.status(400).json({
message: "Invitation already sent"
});
}

const invitation = await Invitation.create({
team: teamId,
sender: req.user._id,
receiver: receiverId
});

res.status(201).json({
message: "Invitation sent successfully",
invitation: invitation
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const getMyInvitations = async (req, res) => {
try {

const invitations = await Invitation.find({
receiver: req.user._id
})
.populate("team", "teamName projectTitle requiredSkills maxMembers")
.populate("sender", "name email");

res.status(200).json({
message: "Invitations fetched successfully",
count: invitations.length,
invitations: invitations
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const acceptInvitation = async (req, res) => {
try {

const invitation = await Invitation.findById(req.params.id);

if (!invitation) {
return res.status(404).json({
message: "Invitation not found"
});
}

if (invitation.receiver.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "You cannot accept this invitation"
});
}

if (invitation.status !== "Pending") {
return res.status(400).json({
message: "Invitation already processed"
});
}

const team = await Team.findById(invitation.team);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

const alreadyMember = team.members.some((memberId) => {
return memberId.toString() === req.user._id.toString();
});

if (alreadyMember) {
invitation.status = "Accepted";
await invitation.save();

return res.status(400).json({
message: "You are already a member of this team"
});
}

if (team.members.length >= team.maxMembers) {
return res.status(400).json({
message: "Team is already full"
});
}

team.members.push(req.user._id);

await team.save();

invitation.status = "Accepted";

await invitation.save();

res.status(200).json({
message: "Invitation accepted successfully",
team: team
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const rejectInvitation = async (req, res) => {
try {

const invitation = await Invitation.findById(req.params.id);

if (!invitation) {
return res.status(404).json({
message: "Invitation not found"
});
}

if (invitation.receiver.toString() !== req.user._id.toString()) {
return res.status(403).json({
message: "You cannot reject this invitation"
});
}

if (invitation.status !== "Pending") {
return res.status(400).json({
message: "Invitation already processed"
});
}

invitation.status = "Rejected";

await invitation.save();

res.status(200).json({
message: "Invitation rejected successfully",
invitation: invitation
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

module.exports = {
sendInvitation,
getMyInvitations,
acceptInvitation,
rejectInvitation
};