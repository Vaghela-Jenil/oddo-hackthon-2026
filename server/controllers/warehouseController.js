const prisma = require("../config/prisma");

/**
 * GET ALL WAREHOUSES with their locations
 * Used by the frontend to populate warehouse/location dropdowns with real IDs.
 */
const getWarehousesController = async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      where: { isActive: true },
      include: {
        locations: {
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json({
      success: true,
      data: warehouses,
    });
  } catch (error) {
    console.error("Get warehouses error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getWarehousesController };
