const prisma = require("../config/prisma");

/**
 * GET ALL PRODUCTS
 */
const getAllProducts = async (filters) => {
  try {
    const { search, categoryId, page = 1, limit = 20, isActive } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search) {
      where.OR = [{ name: { contains: search, mode: "insensitive" } }, { sku: { contains: search, mode: "insensitive" } }];
    }

    // Get products
    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        stockBalances: {
          include: {
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get total count
    const total = await prisma.product.count({ where });

    return {
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get all products error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * CREATE PRODUCT
 */
const createProduct = async (productData) => {
  try {
    const { name, sku, categoryId, unitOfMeasure, lowStockQty, imageUrl } = productData;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return { success: false, error: "Category not found" };
    }

    // Check if SKU already exists
    const existingSku = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingSku) {
      return { success: false, error: "SKU already exists" };
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId,
        unitOfMeasure,
        lowStockQty,
        imageUrl,
      },
      include: { category: true },
    });

    return {
      success: true,
      message: "Product created successfully",
      data: product,
    };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * GET PRODUCT STOCK
 */
const getProductStock = async (productId) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stockBalances: {
          include: {
            location: {
              include: {
                warehouse: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const totalStock = product.stockBalances.reduce((sum, balance) => sum + parseFloat(balance.quantity), 0);

    return {
      success: true,
      data: {
        product,
        stockByLocation: product.stockBalances,
        totalStock,
      },
    };
  } catch (error) {
    console.error("Get product stock error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * UPDATE PRODUCT
 */
const updateProduct = async (productId, updateData) => {
  try {
    const { name, sku, categoryId, unitOfMeasure, lowStockQty } = updateData;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // If SKU is being updated, check for duplicates
    if (sku && sku !== product.sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      });
      if (existingSku) {
        return { success: false, error: "SKU already exists" };
      }
    }

    // If categoryId is being updated, verify it exists
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: categoryId },
      });
      if (!category) {
        return { success: false, error: "Category not found" };
      }
    }

    const updatePayload = {};
    if (name) updatePayload.name = name;
    if (sku) updatePayload.sku = sku;
    if (categoryId) updatePayload.categoryId = categoryId;
    if (unitOfMeasure) updatePayload.unitOfMeasure = unitOfMeasure;
    if (lowStockQty !== undefined) updatePayload.lowStockQty = lowStockQty;

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: updatePayload,
      include: { category: true },
    });

    return {
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  getProductStock,
  updateProduct,
};
