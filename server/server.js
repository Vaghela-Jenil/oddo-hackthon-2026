const express = require("express");
const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const transferRoutes = require("./routes/transferRoutes");
const adjustmentRoutes = require("./routes/adjustmentRoutes");
const stockMoveRoutes = require("./routes/stockMoveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
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

// ═══════════════════════════════
// ✅ API ROUTES
// ═══════════════════════════════

// Auth routes (public + protected)
app.use("/api/auth", authRoutes);

// Inventory routes (all protected with JWT)
app.use("/api/products", productRoutes);
app.use("/api/receipts", receiptRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/transfers", transferRoutes);
app.use("/api/adjustments", adjustmentRoutes);
app.use("/api/stock/moves", stockMoveRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));