const express = require("express");
const {
  getAllProductsController,
  createProductController,
  updateProductController,
  getProductStockController,
} = require("../controllers/productController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * PUBLIC ROUTES (with JWT)
 */

// GET /api/products - List products (search, filter, page)
router.get("/", authMiddleware, getAllProductsController);

// GET /api/products/:id/stock - Stock per location for a product
router.get("/:id/stock", authMiddleware, getProductStockController);

/**
 * PROTECTED ROUTES (with JWT)
 */

// POST /api/products - Create product
router.post("/", authMiddleware, createProductController);

// PUT /api/products/:id - Update product
router.put("/:id", authMiddleware, updateProductController);

module.exports = router;
