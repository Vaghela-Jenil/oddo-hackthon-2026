const prisma = require("../config/prisma");

/**
 * GET STOCK MOVES - Move history with filters
 */
const getStockMoves = async (filters) => {
  try {
    const { productId, locationId, type, startDate, endDate, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where = {};

    if (productId) {
      where.productId = productId;
    }

    if (type && ["RECEIPT", "DELIVERY", "TRANSFER", "ADJUSTMENT"].includes(type)) {
      where.type = type;
    }

    if (locationId) {
      where.OR = [
        { fromLocationId: locationId },
        { toLocationId: locationId },
      ];
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const moves = await prisma.stockMove.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: true,
        fromLocation: {
          include: {
            warehouse: true,
          },
        },
        toLocation: {
          include: {
            warehouse: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.stockMove.count({ where });

    return {
      success: true,
      data: moves,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get stock moves error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getStockMoves,
};
