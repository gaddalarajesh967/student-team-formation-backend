const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
try {

const {
name,
email,
password,
branch,
year,
skills,
interests,
availability,
experience
} = req.body;

if (!name || !email || !password || !branch || !year) {
return res.status(400).json({
message: "Please provide all required fields"
});
}

const existingUser = await User.findOne({ email });

if (existingUser) {
return res.status(400).json({
message: "User already exists"
});
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
name,
email,
password: hashedPassword,
branch,
year,
skills,
interests,
availability,
experience
});

res.status(201).json({
message: "User registered successfully",
user: {
id: user._id,
name: user.name,
email: user.email,
branch: user.branch,
year: user.year,
skills: user.skills,
interests: user.interests,
availability: user.availability,
experience: user.experience
}
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const loginUser = async (req, res) => {
try {

const {
email,
password
} = req.body;

if (!email || !password) {
return res.status(400).json({
message: "Email and password are required"
});
}

const user = await User.findOne({ email });

if (!user) {
return res.status(401).json({
message: "Invalid email or password"
});
}

const passwordMatch = await bcrypt.compare(password, user.password);

if (!passwordMatch) {
return res.status(401).json({
message: "Invalid email or password"
});
}

const token = jwt.sign(
{
id: user._id
},
process.env.JWT_SECRET,
{
expiresIn: "7d"
}
);

res.status(200).json({
message: "Login successful",
token: token,
user: {
id: user._id,
name: user.name,
email: user.email,
branch: user.branch,
year: user.year,
skills: user.skills,
interests: user.interests,
availability: user.availability,
experience: user.experience
}
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const getProfile = async (req, res) => {
try {

res.status(200).json({
message: "Profile fetched successfully",
user: req.user
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const searchStudents = async (req, res) => {
try {

const {
skill,
branch,
year,
availability,
experience
} = req.query;

const filter = {
_id: {
$ne: req.user._id
}
};

if (skill) {
filter.skills = {
$regex: skill,
$options: "i"
};
}

if (branch) {
filter.branch = {
$regex: `^${branch}$`,
$options: "i"
};
}

if (year) {
filter.year = Number(year);
}

if (availability !== undefined) {
filter.availability = availability === "true";
}

if (experience) {
filter.experience = {
$regex: `^${experience}$`,
$options: "i"
};
}

const students = await User.find(filter).select("-password");

res.status(200).json({
message: "Students fetched successfully",
count: students.length,
students: students
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

const updateProfile = async (req, res) => {
try {

const user = await User.findById(req.user._id);

if (!user) {
return res.status(404).json({
message: "User not found"
});
}

const {
name,
branch,
year,
skills,
interests,
availability,
experience
} = req.body;

if (name !== undefined) {
user.name = name;
}

if (branch !== undefined) {
user.branch = branch;
}

if (year !== undefined) {
user.year = year;
}

if (skills !== undefined) {
user.skills = skills;
}

if (interests !== undefined) {
user.interests = interests;
}

if (availability !== undefined) {
user.availability = availability;
}

if (experience !== undefined) {
user.experience = experience;
}

await user.save();

res.status(200).json({
message: "Profile updated successfully",
user: {
id: user._id,
name: user.name,
email: user.email,
branch: user.branch,
year: user.year,
skills: user.skills,
interests: user.interests,
availability: user.availability,
experience: user.experience
}
});

} catch (error) {

res.status(500).json({
message: "Server error",
error: error.message
});

}
};

module.exports = {
registerUser,
loginUser,
getProfile,
searchStudents,
updateProfile
};