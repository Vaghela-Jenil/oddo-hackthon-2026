const express = require("express");
const {
  getAllProductsController,
  createProductController,
  updateProductController,
  getProductStockController,
} = require("../controllers/productController");
const { authMiddleware, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PUBLIC ROUTES (with JWT)
 */

// GET /api/products - List products (search, filter, page)
router.get("/", authMiddleware, getAllProductsController);

// GET /api/products/:id/stock - Stock per location for a product
router.get("/:id/stock", authMiddleware, getProductStockController);

/**
 * PROTECTED ROUTES (Manager only)
 */

// POST /api/products - Create product
router.post("/", authMiddleware, authorize("MANAGER"), createProductController);

// PUT /api/products/:id - Update product
router.put("/:id", authMiddleware, authorize("MANAGER"), updateProductController);

module.exports = router;
