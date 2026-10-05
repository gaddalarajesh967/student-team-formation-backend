const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const teamRoutes = require("./routes/teamRoutes");
const invitationRoutes = require("./routes/invitationRoutes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
res.send("Student Team Formation Backend API Running");
});

app.use("/api/users", userRoutes);

app.use("/api/teams", teamRoutes);

app.use("/api/invitations", invitationRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
console.log(`Server running on http://localhost:${PORT}`);
});