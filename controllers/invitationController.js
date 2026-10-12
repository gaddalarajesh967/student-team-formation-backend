
const mongoose = require("mongoose");
const Invitation = require("../models/Invitation");
const Team = require("../models/Team");
const User = require("../models/User");

const sendInvitation = async (req, res) => {
try {

const { teamId, receiverId } = req.body;

if (!teamId || !receiverId) {
return res.status(400).json({
message: "Team ID and receiver ID are required"
});
}

if (
!mongoose.isValidObjectId(teamId) ||
!mongoose.isValidObjectId(receiverId)
) {
return res.status(400).json({
message: "Invalid team ID or student ID"
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

if (receiverId.toString() === req.user._id.toString()) {
return res.status(400).json({
message: "You cannot invite yourself"
});
}

const receiver = await User.findById(receiverId);

if (!receiver) {
return res.status(404).json({
message: "Student not found"
});
}

const alreadyMember = team.members.some(memberId => {
return memberId.toString() === receiverId.toString();
});

if (alreadyMember) {
return res.status(400).json({
message: "Student is already a member of this team"
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
message: "Invitation already sent to this student"
});
}

const invitation = await Invitation.create({
team: teamId,
sender: req.user._id,
receiver: receiverId,
status: "Pending"
});

res.status(201).json({
message: "Invitation sent successfully",
invitation
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
.populate("sender", "name email")
.sort({ _id: -1 });

res.status(200).json({
message: "Invitations fetched successfully",
count: invitations.length,
invitations
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

const invitationId = req.params.id;

if (!mongoose.isValidObjectId(invitationId)) {
return res.status(400).json({
message: "Invalid invitation ID"
});
}

const invitation = await Invitation.findById(invitationId);

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

const alreadyMember = team.members.some(memberId => {
return memberId.toString() === req.user._id.toString();
});

if (alreadyMember) {
return res.status(400).json({
message: "You are already a member of this team"
});
}

if (team.members.length >= team.maxMembers) {
return res.status(400).json({
message: "Team is already full"
});
}

const updatedTeam = await Team.findOneAndUpdate(
{
_id: team._id,
members: { $ne: req.user._id },
$expr: {
$lt: [
{ $size: "$members" },
"$maxMembers"
]
}
},
{
$addToSet: {
members: req.user._id
}
},
{
new: true
}
);

if (!updatedTeam) {
return res.status(400).json({
message: "Team is full or you are already a member"
});
}

invitation.status = "Accepted";

try {
await invitation.save();
} catch (saveError) {
await Team.updateOne(
{ _id: updatedTeam._id },
{ $pull: { members: req.user._id } }
);
throw saveError;
}

res.status(200).json({
message: "Invitation accepted successfully",
team: updatedTeam
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

const invitationId = req.params.id;

if (!mongoose.isValidObjectId(invitationId)) {
return res.status(400).json({
message: "Invalid invitation ID"
});
}

const invitation = await Invitation.findOneAndUpdate(
{
_id: invitationId,
receiver: req.user._id,
status: "Pending"
},
{
$set: {
status: "Rejected"
}
},
{
new: true
}
);

if (!invitation) {
return res.status(400).json({
message: "Invitation not found, unauthorized, or already processed"
});
}

res.status(200).json({
message: "Invitation rejected successfully",
invitation
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
