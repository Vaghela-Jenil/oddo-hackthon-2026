const express = require("express");
const {
  getStockMovesController,
} = require("../controllers/stockMoveController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PROTECTED ROUTES (JWT required)
 */

// GET /api/stock/moves - Move history (ledger) with filters
router.get("/", authMiddleware, getStockMovesController);

module.exports = router;
