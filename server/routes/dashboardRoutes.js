const express = require("express");
const {
  getDashboardKPIsController,
} = require("../controllers/dashboardController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/dashboard/kpis - Aggregate KPI counts for dashboard
router.get("/kpis", authMiddleware, getDashboardKPIsController);

module.exports = router;
