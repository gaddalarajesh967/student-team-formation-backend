const mongoose = require("mongoose");

const teamResourceSchema = new mongoose.Schema({
team: {
type: mongoose.Schema.Types.ObjectId,
ref: "Team",
required: true,
index: true
},
sharedBy: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},
title: {
type: String,
required: true,
trim: true,
maxlength: 120
},
url: {
type: String,
required: true,
trim: true,
maxlength: 2048
},
description: {
type: String,
default: "",
maxlength: 500
}
}, { timestamps: true });

teamResourceSchema.index({ team: 1, createdAt: -1 });

module.exports = mongoose.model("TeamResource", teamResourceSchema);