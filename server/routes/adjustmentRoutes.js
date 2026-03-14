const express = require("express");
const {
  validateAdjustmentController,
} = require("../controllers/adjustmentController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (Manager only)
 */

// POST /api/adjustments/:id/validate - Apply adjustment
router.post("/:id/validate", authMiddleware, validateAdjustmentController);

module.exports = router;
