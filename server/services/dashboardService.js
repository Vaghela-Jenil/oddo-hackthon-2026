const prisma = require("../config/prisma");

/**
 * GET DASHBOARD KPIs
 */
const getDashboardKPIs = async (warehouseId) => {
  try {
    const where = warehouseId ? { warehouseId } : {};

    // Count receipts by status
    const receipts = await prisma.receipt.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Count deliveries by status
    const deliveries = await prisma.deliveryOrder.groupBy({
      by: ["status"],
      where,
      _count: true,
    });

    // Count products
    const totalProducts = await prisma.product.count();
    const activeProducts = await prisma.product.count({
      where: { isActive: true },
    });

    // Count warehouses
    const totalWarehouses = await prisma.warehouse.count();
    const activeWarehouses = await prisma.warehouse.count({
      where: { isActive: true },
    });

    // Get total stock value (simplified)
    const stockBalances = await prisma.stockBalance.findMany({
      include: {
        product: true,
      },
    });

    const totalStockItems = stockBalances.reduce((sum, balance) => sum + parseFloat(balance.quantity), 0);

    // Low stock alerts
    const lowStockProducts = await prisma.stockBalance.findMany({
      where: {
        quantity: {
          lt: prisma.product.fields.lowStockQty,
        },
      },
      include: {
        product: true,
        location: true,
      },
    });

    return {
      success: true,
      data: {
        receipts: {
          byStatus: receipts.reduce(
            (acc, item) => {
              acc[item.status] = item._count;
              return acc;
            },
            {}
          ),
          total: receipts.reduce((sum, item) => sum + item._count, 0),
        },
        deliveries: {
          byStatus: deliveries.reduce(
            (acc, item) => {
              acc[item.status] = item._count;
              return acc;
            },
            {}
          ),
          total: deliveries.reduce((sum, item) => sum + item._count, 0),
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        warehouses: {
          total: totalWarehouses,
          active: activeWarehouses,
          inactive: totalWarehouses - activeWarehouses,
        },
        inventory: {
          totalItems: totalStockItems,
          lowStockAlerts: lowStockProducts.length,
        },
        timestamp: new Date(),
      },
    };
  } catch (error) {
    console.error("Get dashboard KPIs error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getDashboardKPIs,
};
