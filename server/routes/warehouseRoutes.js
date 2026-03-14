const express = require("express");
const { 
  getWarehousesController,
  createWarehouseController,
  addLocationToWarehouseController 
} = require("../controllers/warehouseController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/warehouses – list all active warehouses with their locations
router.get("/", authMiddleware, getWarehousesController);

// POST /api/warehouses – create a new warehouse
router.post("/", authMiddleware, createWarehouseController);

// POST /api/warehouses/:warehouseId/locations – add location to warehouse
router.post("/:warehouseId/locations", authMiddleware, addLocationToWarehouseController);

module.exports = router;
