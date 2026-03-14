const express = require("express");
const { getWarehousesController } = require("../controllers/warehouseController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/warehouses – list all active warehouses with their locations
router.get("/", authMiddleware, getWarehousesController);

module.exports = router;
