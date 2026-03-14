const {
  getAllProducts,
  createProduct,
  getProductStock,
} = require("../services/productService");

/**
 * GET ALL PRODUCTS - List products with search, filter, and pagination
 */
const getAllProductsController = async (req, res) => {
  try {
    const { search, categoryId, page = 1, limit = 20, isActive } = req.query;

    const result = await getAllProducts({
      search,
      categoryId,
      page: parseInt(page),
      limit: parseInt(limit),
      isActive: isActive !== undefined ? isActive === "true" : undefined,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * CREATE PRODUCT - Create new product (Manager only)
 */
const createProductController = async (req, res) => {
  try {
    const { name, sku, categoryId, unitOfMeasure = "pcs", lowStockQty = 0, imageUrl } = req.body;

    if (!name || !sku || !categoryId) {
      return res.status(400).json({ error: "name, sku, and categoryId are required" });
    }

    const result = await createProduct({
      name,
      sku,
      categoryId,
      unitOfMeasure,
      lowStockQty: parseFloat(lowStockQty),
      imageUrl,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET PRODUCT STOCK - Get stock per location for a product
 */
const getProductStockController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const result = await getProductStock(id);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get product stock error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllProductsController,
  createProductController,
  getProductStockController,
};
