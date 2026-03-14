const express = require("express");
const {
  createTransferController,
  validateTransferController,
} = require("../controllers/transferController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// POST /api/transfers - Create internal transfer
router.post("/", authMiddleware, createTransferController);

// PUT /api/transfers/:id/validate - Execute transfer (atomic swap)
router.put("/:id/validate", authMiddleware, validateTransferController);

module.exports = router;
