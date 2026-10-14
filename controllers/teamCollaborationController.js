const mongoose = require("mongoose");
const Team = require("../models/Team");
const TeamMessage = require("../models/TeamMessage");
const TeamResource = require("../models/TeamResource");

const checkMember = async (req, res, next) => {
try {
const teamId = req.params.id;

if (!mongoose.isValidObjectId(teamId)) {
return res.status(400).json({
message: "Invalid team ID"
});
}

const team = await Team.findById(teamId);

if (!team) {
return res.status(404).json({
message: "Team not found"
});
}

const userId = String(req.user._id);

const isMember = (team.members || []).some(
member => String(member) === userId
);

const isLeader =
team.leader && String(team.leader) === userId;

if (!isMember && !isLeader) {
return res.status(403).json({
message: "Only team members can access this feature"
});
}

req.team = team;
next();

} catch (error) {
console.error("Team access error:", error);

return res.status(500).json({
message: "Unable to verify team membership"
});
}
};

// GET TEAM CHAT MESSAGES

const getMessages = async (req, res) => {
try {
const messages = await TeamMessage.find({
team: req.team._id
})
.sort({ createdAt: -1, _id: -1 })
.limit(100)
.populate("sender", "name email")
.lean();

return res.status(200).json({
message: "Messages fetched successfully",
messages: messages.reverse()
});

} catch (error) {
console.error("Get messages error:", error);

return res.status(500).json({
message: "Unable to fetch messages"
});
}
};

// SEND TEAM MESSAGE

const sendMessage = async (req, res) => {
try {
const text = String(req.body.text || "").trim();

if (!text || text.length > 2000) {
return res.status(400).json({
message: "Message must contain 1 to 2000 characters"
});
}

const newMessage = await TeamMessage.create({
team: req.team._id,
sender: req.user._id,
text
});

await newMessage.populate("sender", "name email");

return res.status(201).json({
message: "Message sent successfully",
data: newMessage
});

} catch (error) {
console.error("Send message error:", error);

return res.status(500).json({
message: "Unable to send message"
});
}
};

// GET SHARED PROJECT TEMPLATES

const getResources = async (req, res) => {
try {
const resources = await TeamResource.find({
team: req.team._id
})
.sort({ createdAt: -1 })
.populate("sharedBy", "name email");

return res.status(200).json({
message: "Resources fetched successfully",
resources
});

} catch (error) {
console.error("Get resources error:", error);

return res.status(500).json({
message: "Unable to fetch resources"
});
}
};

// SHARE PROJECT TEMPLATE LINK

const shareResource = async (req, res) => {
try {
const title = String(req.body.title || "").trim();
const description = String(req.body.description || "").trim();
const url = String(req.body.url || "").trim();

if (!title || title.length > 120) {
return res.status(400).json({
message: "Title must contain 1 to 120 characters"
});
}

if (description.length > 500) {
return res.status(400).json({
message: "Description must not exceed 500 characters"
});
}

if (!url || url.length > 2048) {
return res.status(400).json({
message: "Invalid resource URL length"
});
}

let parsedUrl;

try {
parsedUrl = new URL(url);
} catch {
return res.status(400).json({
message: "Enter a valid HTTPS link"
});
}

if (
parsedUrl.protocol !== "https:" ||
!parsedUrl.hostname ||
parsedUrl.username ||
parsedUrl.password
) {
return res.status(400).json({
message: "Only valid HTTPS links are allowed"
});
}

const resource = await TeamResource.create({
team: req.team._id,
sharedBy: req.user._id,
title,
url,
description
});

await resource.populate("sharedBy", "name email");

return res.status(201).json({
message: "Project resource shared successfully",
resource
});

} catch (error) {
console.error("Share resource error:", error);

return res.status(500).json({
message: "Unable to share project resource"
});
}
};

module.exports = {
checkMember,
getMessages,
sendMessage,
getResources,
shareResource
};