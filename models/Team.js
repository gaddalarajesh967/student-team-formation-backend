const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
teamName: {
type: String,
required: true
},
projectTitle: {
type: String,
required: true
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
default: 4
},
leader: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
members: [
{
type: mongoose.Schema.Types.ObjectId,
ref: "User"
}
],
status: {
type: String,
enum: ["Open", "Full", "Closed"],
default: "Open"
}
}, {
timestamps: true
});

module.exports = mongoose.model("Team", teamSchema);