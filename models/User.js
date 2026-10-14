
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
name: {
type: String,
required: true,
trim: true
},

email: {
type: String,
required: true,
unique: true,
lowercase: true,
trim: true
},

password: {
type: String,
required: true
},

branch: {
type: String,
required: true
},

year: {
type: Number,
required: true
},

skills: {
type: [String],
default: []
},

interests: {
type: [String],
default: []
},

availability: {
type: Boolean,
default: true
},

experience: {
type: String,
default: "Beginner"
},

profilePhoto: {
type: String,
default: ""
},

isEmailVerified: {
type: Boolean,
default: false
},

resetTokenHash: {
type: String,
default: null,
select: false
},

resetTokenExpiresAt: {
type: Date,
default: null,
select: false
}
},
{
timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);
