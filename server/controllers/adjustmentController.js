const {
  validateAdjustment,
  createAdjustment,
  getAllAdjustments,
} = require("../services/adjustmentService");

/**
 * GET ALL ADJUSTMENTS
 */
const getAllAdjustmentsController = async (req, res) => {
  try {
    const { warehouseId, page = 1, limit = 20, status } = req.query;

    const result = await getAllAdjustments({
      warehouseId,
      status,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get adjustments error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * CREATE ADJUSTMENT
 */
const createAdjustmentController = async (req, res) => {
  try {
    const { warehouseId, lines } = req.body;

    if (!warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: "warehouseId and lines are required" });
    }

    const result = await createAdjustment({
      warehouseId,
      lines,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Create adjustment error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * VALIDATE ADJUSTMENT - Apply correction move (Manager only)
 */
const validateAdjustmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!id) {
      return res.status(400).json({ error: "Adjustment ID is required" });
    }

    // Check if user is Manager
    if (userRole !== "MANAGER") {
      return res.status(403).json({ error: "Only MANAGER can validate adjustments" });
    }

    const result = await validateAdjustment(id, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Validate adjustment error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllAdjustmentsController,
  createAdjustmentController,
  validateAdjustmentController,
};
