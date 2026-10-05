const mongoose = require("mongoose");

const invitationSchema = new mongoose.Schema({
team: {
type: mongoose.Schema.Types.ObjectId,
ref: "Team",
required: true
},
sender: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
receiver: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
status: {
type: String,
enum: ["Pending", "Accepted", "Rejected"],
default: "Pending"
}
}, {
timestamps: true
});

module.exports = mongoose.model("Invitation", invitationSchema);