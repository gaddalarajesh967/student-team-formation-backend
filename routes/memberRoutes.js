
const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Team = require("../models/Team");
const protect = require("../middleware/authMiddleware");

const router = express.Router();

const joinRequestSchema = new mongoose.Schema({
team: {
type: mongoose.Schema.Types.ObjectId,
ref: "Team",
required: true
},
student: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
status: {
type: String,
enum: ["Pending", "Accepted", "Rejected"],
default: "Pending"
}
}, { timestamps: true });

joinRequestSchema.index(
{ team: 1, student: 1 },
{ unique: true }
);

const JoinRequest = mongoose.models.JoinRequest ||
mongoose.model("JoinRequest", joinRequestSchema);

router.get("/students", protect, async (req, res) => {
try {
const search = String(req.query.search || "").trim();

const filter = search
? {
$or: [
{ name: { $regex: search, $options: "i" } },
{ branch: { $regex: search, $options: "i" } },
{ skills: { $regex: search, $options: "i" } }
]
}
: {};

const students = await User.find(filter)
.select("-password")
.limit(100)
.lean();

res.json({ students });
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.put("/profile", protect, async (req, res) => {
try {
const allowed = [
"name",
"branch",
"year",
"skills",
"interests",
"experience",
"availability"
];

const updates = {};

for (const field of allowed) {
if (req.body[field] !== undefined) {
updates[field] = req.body[field];
}
}

const user = await User.findByIdAndUpdate(
req.user._id,
{ $set: updates },
{ new: true, runValidators: true }
).select("-password");

if (!user) {
return res.status(404).json({ message: "User not found" });
}

res.json({ message: "Profile updated", user });
} catch (error) {
res.status(400).json({ message: error.message });
}
});

router.post("/join-requests", protect, async (req, res) => {
try {
const { teamId } = req.body;

if (!mongoose.isValidObjectId(teamId)) {
return res.status(400).json({ message: "Invalid team ID" });
}

const team = await Team.findById(teamId);

if (!team) {
return res.status(404).json({ message: "Team not found" });
}

if (!team.leader) {
return res.status(400).json({
message: "This team does not have a leader yet"
});
}

if (team.members.some(id => String(id) === String(req.user._id))) {
return res.status(400).json({
message: "You are already a member"
});
}

if (team.members.length >= team.maxMembers) {
return res.status(400).json({ message: "Team is full" });
}

const existing = await JoinRequest.findOne({
team: teamId,
student: req.user._id
});

if (existing && existing.status === "Pending") {
return res.status(400).json({
message: "Request already sent"
});
}

if (existing) {
existing.status = "Pending";
await existing.save();
return res.json({ message: "Request sent", request: existing });
}

const request = await JoinRequest.create({
team: teamId,
student: req.user._id
});

res.status(201).json({
message: "Join request sent successfully",
request
});
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.get("/join-requests/my", protect, async (req, res) => {
try {
const requests = await JoinRequest.find({
student: req.user._id
})
.populate("team", "teamName projectTitle")
.sort({ createdAt: -1 });

res.json({ requests });
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.get("/join-requests/received", protect, async (req, res) => {
try {
const teams = await Team.find({ leader: req.user._id })
.select("_id");

const requests = await JoinRequest.find({
team: { $in: teams.map(t => t._id) }
})
.populate("student", "name email branch year skills")
.populate("team", "teamName projectTitle")
.sort({ createdAt: -1 });

res.json({ requests });
} catch (error) {
res.status(500).json({ message: error.message });
}
});

router.put("/join-requests/:id/respond", protect, async (req, res) => {
try {
const { action } = req.body;

if (!["accept", "reject"].includes(action)) {
return res.status(400).json({ message: "Invalid action" });
}

const request = await JoinRequest.findById(req.params.id);

if (!request || request.status !== "Pending") {
return res.status(404).json({
message: "Pending request not found"
});
}

const team = await Team.findById(request.team);

if (!team || String(team.leader) !== String(req.user._id)) {
return res.status(403).json({
message: "Only the team leader can respond"
});
}

if (action === "reject") {
request.status = "Rejected";
await request.save();
return res.json({ message: "Request rejected" });
}

const updated = await Team.findOneAndUpdate(
{
_id: team._id,
members: { $ne: request.student },
$expr: {
$lt: [
{ $size: "$members" },
"$maxMembers"
]
}
},
{ $addToSet: { members: request.student } },
{ new: true }
);

if (!updated) {
return res.status(409).json({
message: "Team is full or student already joined"
});
}

request.status = "Accepted";
await request.save();

res.json({ message: "Student joined successfully" });
} catch (error) {
res.status(500).json({ message: error.message });
}
});

module.exports = router;
