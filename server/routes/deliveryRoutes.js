const express = require("express");
const {
  getAllDeliveriesController,
  createDeliveryController,
  validateDeliveryController,
} = require("../controllers/deliveryController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/deliveries - List deliveries (status, warehouse)
router.get("/", authMiddleware, getAllDeliveriesController);

// POST /api/deliveries - Create delivery
router.post("/", authMiddleware, createDeliveryController);

// PUT /api/deliveries/:id/validate - Validate delivery
router.put("/:id/validate", authMiddleware, validateDeliveryController);

module.exports = router;
