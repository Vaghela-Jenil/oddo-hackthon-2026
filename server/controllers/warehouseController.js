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

/**
 * CREATE WAREHOUSE
 */
const createWarehouseController = async (req, res) => {
  try {
    const { name, locations = [] } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Warehouse name is required" });
    }

    // Check if warehouse already exists
    const existing = await prisma.warehouse.findUnique({
      where: { name: name.trim() },
    });

    if (existing) {
      return res.status(400).json({ error: "Warehouse with this name already exists" });
    }

    // Create warehouse with locations
    const warehouse = await prisma.warehouse.create({
      data: {
        name: name.trim(),
        isActive: true,
        locations: {
          create: locations.map((loc) => ({
            name: typeof loc === "string" ? loc : loc.name,
            isActive: true,
          })),
        },
      },
      include: {
        locations: true,
      },
    });

    res.status(201).json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error("Create warehouse error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * ADD LOCATION TO WAREHOUSE
 */
const addLocationToWarehouseController = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ error: "Location name is required" });
    }

    if (!warehouseId) {
      return res.status(400).json({ error: "Warehouse ID is required" });
    }

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: warehouseId },
    });

    if (!warehouse) {
      return res.status(404).json({ error: "Warehouse not found" });
    }

    // Check if location already exists in this warehouse
    const existingLocation = await prisma.location.findFirst({
      where: {
        name: name.trim(),
        warehouseId: warehouseId,
      },
    });

    if (existingLocation) {
      return res.status(400).json({ error: "Location already exists in this warehouse" });
    }

    // Create location
    const location = await prisma.location.create({
      data: {
        name: name.trim(),
        warehouseId: warehouseId,
        isActive: true,
      },
    });

    res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error("Add location error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { 
  getWarehousesController, 
  createWarehouseController,
  addLocationToWarehouseController 
};
