
const mongoose = require("mongoose");

const pendingRegistrationSchema = new mongoose.Schema({
name: { type: String, required: true },
email: {
type: String,
required: true,
unique: true,
lowercase: true,
trim: true
},
password: { type: String, required: true },
branch: { type: String, required: true },
year: { type: Number, required: true },
skills: { type: [String], default: [] },
interests: { type: [String], default: [] },
availability: { type: Boolean, default: true },
experience: { type: String, default: "Beginner" },

verificationTokenHash: {
type: String,
required: true,
select: false
},
verificationExpiresAt: {
type: Date,
required: true
},
verificationLastSentAt: {
type: Date,
required: true
},
expiresAt: {
type: Date,
required: true,
index: { expires: 0 }
}
}, { timestamps: true });

module.exports = mongoose.model(
"PendingRegistration",
pendingRegistrationSchema
);
