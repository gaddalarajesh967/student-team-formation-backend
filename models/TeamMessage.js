const mongoose = require("mongoose");

const teamMessageSchema = new mongoose.Schema({
team: {
type: mongoose.Schema.Types.ObjectId,
ref: "Team",
required: true,
index: true
},
sender: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
text: {
type: String,
required: true,
trim: true,
maxlength: 2000
}
}, { timestamps: true });

teamMessageSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model("TeamMessage", teamMessageSchema);