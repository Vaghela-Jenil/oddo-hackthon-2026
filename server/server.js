const express = require("express");
const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
require("dotenv").config();

const app = express();
app.use(express.json());

// Health check endpoint
app.get("/", async (req, res) => {
  try {
    // Check connection by doing a simple query
    await prisma.$connect();
    res.send("🚀 Server and Database Connected!");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Auth routes (public + protected)
app.use("/api/auth", authRoutes);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));