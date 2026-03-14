const {
  validateAdjustment,
} = require("../services/adjustmentService");

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
  validateAdjustmentController,
};
