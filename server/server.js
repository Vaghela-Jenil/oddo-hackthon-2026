const express = require("express");
const cors = require("cors");
const prisma = require("./config/prisma");
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const receiptRoutes = require("./routes/receiptRoutes");
const deliveryRoutes = require("./routes/deliveryRoutes");
const transferRoutes = require("./routes/transferRoutes");
const adjustmentRoutes = require("./routes/adjustmentRoutes");
const stockMoveRoutes = require("./routes/stockMoveRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const { authMiddleware } = require("./middleware/authMiddleware");
require("dotenv").config();

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:8000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// ═══════════════════════════════
// DEBUG MIDDLEWARE - Log all requests
// ═══════════════════════════════
app.use((req, res, next) => {
  console.log(`📨 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log("   Headers:", { 'content-type': req.get('content-type'), 'origin': req.get('origin') });
  if (req.method !== 'GET') {
    console.log("   Body:", req.body);
  }
  next();
});

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

// Debug route - Show all registered routes
app.get("/api/debug/routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        method: Object.keys(middleware.route.methods)[0].toUpperCase(),
        path: middleware.route.path,
      });
    } else if (middleware.name === "router") {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            method: Object.keys(handler.route.methods)[0].toUpperCase(),
            path: "/api/auth" + handler.route.path,
          });
        }
      });
    }
  });
  res.json({ routes: routes.filter(r => r.method && r.path) });
});

// Debug endpoint - Show all users
app.get("/api/debug/users", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    res.json({ 
      totalUsers: users.length,
      users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Debug endpoint - Create a test user
app.post("/api/debug/create-test-user", async (req, res) => {
  try {
    const bcrypt = require("bcryptjs");
    const testEmail = "test@example.com";
    const testPassword = "test123456";
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email: testEmail } });
    
    if (existingUser) {
      return res.json({ 
        message: "Test user already exists",
        user: { id: existingUser.id, email: existingUser.email, name: existingUser.name }
      });
    }
    
    // Create test user
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(testPassword, salt);
    
    const newUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: testEmail,
        passwordHash,
        role: "STAFF",
        isActive: true
      }
    });
    
    res.json({ 
      message: "Test user created successfully",
      credentials: {
        email: testEmail,
        password: testPassword
      },
      user: { id: newUser.id, email: newUser.email, name: newUser.name }
    });
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
app.use("/api/warehouses", warehouseRoutes);

// Example protected route
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    message: "This is a protected route",
    user: req.user,
  });
});

// ═══════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════

// 404 Handler - Must be before error handler
app.use((req, res) => {
  console.error(`❌ 404 Not Found: ${req.method} ${req.path}`);
  console.error("   Full URL:", req.originalUrl);
  console.error("   Query:", req.query);
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    method: req.method,
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.message);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`🚀 Running on http://localhost:${PORT}`));