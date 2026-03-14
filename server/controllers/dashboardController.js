const {
  getDashboardKPIs,
} = require("../services/dashboardService");

/**
 * GET DASHBOARD KPIs - Aggregate counts
 */
const getDashboardKPIsController = async (req, res) => {
  try {
    const { warehouseId } = req.query;

    const result = await getDashboardKPIs(warehouseId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get dashboard KPIs error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getDashboardKPIsController,
};
