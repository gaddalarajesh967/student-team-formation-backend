const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    branch: {
      type: String,
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    skills: {
      type: [String],
      default: [],
    },

    interests: {
      type: [String],
      default: [],
    },

    availability: {
      type: Boolean,
      default: true,
    },

    experience: {
      type: String,
      default: "Beginner",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);