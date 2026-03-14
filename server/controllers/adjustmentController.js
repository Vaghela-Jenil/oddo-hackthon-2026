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
    const { page = 1, limit = 20, status } = req.query;

    const result = await getAllAdjustments({
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
    const { lines, reason } = req.body;

    if (!lines || lines.length === 0) {
      return res.status(400).json({ error: "lines array is required" });
    }

    const result = await createAdjustment({
      lines,
      reason,
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
 * VALIDATE ADJUSTMENT
 */
const validateAdjustmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "Adjustment ID is required" });
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
