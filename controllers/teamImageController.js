
const mongoose = require("mongoose");
const TeamImage = require("../models/TeamImage");

const allowedTypes = [
"image/jpeg",
"image/png",
"image/webp",
"image/gif"
];

const MAX_BYTES = 2 * 1024 * 1024;

async function uploadTeamImage(req, res) {
try {
const { fileName, mimeType, imageData, caption } = req.body;

if (
typeof fileName !== "string" ||
typeof mimeType !== "string" ||
typeof imageData !== "string" ||
!allowedTypes.includes(mimeType)
) {
return res.status(400).json({
message: "Invalid image. Select JPG, PNG, WebP or GIF."
});
}

const match = imageData.match(
/^data:image\/(jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/
);

if (!match) {
return res.status(400).json({
message: "Invalid image data"
});
}

const bytes = Buffer.from(match[2], "base64");

if (bytes.length === 0 || bytes.length > MAX_BYTES) {
return res.status(400).json({
message: "Image must be 2 MB or smaller"
});
}

const signatures = {
"image/jpeg":
bytes[0] === 0xff &&
bytes[1] === 0xd8 &&
bytes[2] === 0xff,

"image/png":
bytes.subarray(0, 8).equals(
Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
),

"image/gif":
["GIF87a", "GIF89a"].includes(
bytes.subarray(0, 6).toString("ascii")
),

"image/webp":
bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
bytes.subarray(8, 12).toString("ascii") === "WEBP"
};

if (!signatures[mimeType]) {
return res.status(400).json({
message: "Image format does not match its content"
});
}

const image = await TeamImage.create({
team: req.team._id,
uploadedBy: req.user._id,
fileName: fileName.slice(0, 150),
mimeType,
imageData,
caption: String(caption || "").slice(0, 200)
});

return res.status(201).json({
message: "Image uploaded successfully",
imageId: image._id
});

} catch (error) {
console.error("Upload image error:", error);

return res.status(500).json({
message: "Image upload failed"
});
}
}

async function getTeamImages(req, res) {
try {
const images = await TeamImage.find({
team: req.team._id
})
.sort({ createdAt: -1 })
.limit(30)
.populate("uploadedBy", "name")
.lean();

return res.status(200).json({
images
});

} catch (error) {
console.error("Get images error:", error);

return res.status(500).json({
message: "Unable to load images"
});
}
}

async function deleteTeamImage(req, res) {
try {
const imageId = req.params.imageId;

if (!mongoose.isValidObjectId(imageId)) {
return res.status(400).json({
message: "Invalid image ID"
});
}

const image = await TeamImage.findOne({
_id: imageId,
team: req.team._id
});

if (!image) {
return res.status(404).json({
message: "Image not found"
});
}

const userId = String(req.user._id);
const uploaderId = String(image.uploadedBy);
const leaderId = String(req.team.leader?._id || req.team.leader || "");

if (userId !== uploaderId && userId !== leaderId) {
return res.status(403).json({
message: "Only the uploader or team leader can delete this image"
});
}

await image.deleteOne();

return res.status(200).json({
message: "Image deleted successfully"
});

} catch (error) {
console.error("Delete image error:", error);

return res.status(500).json({
message: "Unable to delete image"
});
}
}

module.exports = {
uploadTeamImage,
getTeamImages,
deleteTeamImage
};
