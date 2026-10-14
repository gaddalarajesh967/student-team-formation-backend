
const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
teamName: {
type: String,
required: true,
trim: true
},
projectTitle: {
type: String,
required: true,
trim: true
},
projectDescription: {
type: String,
default: ""
},
requiredSkills: {
type: [String],
default: []
},
maxMembers: {
type: Number,
default: 4,
min: 2,
max: 20
},
leader: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
default: null
},
createdBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
formationType: {
type: String,
enum: ["LeaderCreated", "MemberCreated"],
default: "LeaderCreated"
},
members: [{
type: mongoose.Schema.Types.ObjectId,
ref: "User"
}],
status: {
type: String,
enum: ["PendingLeader", "Open", "Full", "Closed"],
default: "Open"
}
}, {
timestamps: true
});

teamSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Team", teamSchema);
