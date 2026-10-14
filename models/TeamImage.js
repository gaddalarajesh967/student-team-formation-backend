const mongoose = require("mongoose");

const teamImageSchema = new mongoose.Schema({
team: {
type: mongoose.Schema.Types.ObjectId,
ref: "Team",
required: true
},
uploadedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
fileName: {
type: String,
required: true
},
mimeType: {
type: String,
required: true
},
imageData: {
type: String,
required: true
},
caption: {
type: String,
default: "",
maxlength: 200
}
}, { timestamps: true });

teamImageSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model("TeamImage", teamImageSchema);