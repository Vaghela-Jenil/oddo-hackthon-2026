const express = require("express");
const {
  getAllReceiptsController,
  createReceiptController,
  validateReceiptController,
} = require("../controllers/receiptController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/receipts - List receipts (status, warehouse)
router.get("/", authMiddleware, getAllReceiptsController);

// POST /api/receipts - Create receipt
router.post("/", authMiddleware, createReceiptController);

// PUT /api/receipts/:id/validate - Validate receipt
router.put("/:id/validate", authMiddleware, validateReceiptController);

module.exports = router;
