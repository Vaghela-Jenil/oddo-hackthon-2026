const express = require("express");
const {
  getAllTransfersController,
  createTransferController,
  validateTransferController,
} = require("../controllers/transferController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/transfers - List transfers
router.get("/", authMiddleware, getAllTransfersController);

// POST /api/transfers - Create internal transfer
router.post("/", authMiddleware, createTransferController);

// PUT /api/transfers/:id/validate - Execute transfer (atomic swap)
router.put("/:id/validate", authMiddleware, validateTransferController);

module.exports = router;
