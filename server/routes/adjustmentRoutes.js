const express = require("express");
const {
  getAllAdjustmentsController,
  createAdjustmentController,
  validateAdjustmentController,
} = require("../controllers/adjustmentController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/adjustments - List adjustments (status, warehouse)
router.get("/", authMiddleware, getAllAdjustmentsController);

// POST /api/adjustments - Create adjustment
router.post("/", authMiddleware, createAdjustmentController);

// PUT /api/adjustments/:id/validate - Validate adjustment (Manager only)
router.put("/:id/validate", authMiddleware, authorize("MANAGER"), validateAdjustmentController);

module.exports = router;
