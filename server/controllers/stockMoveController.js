const {
  getStockMoves,
} = require("../services/stockMoveService");

/**
 * GET STOCK MOVES - Move history with filters
 */
const getStockMovesController = async (req, res) => {
  try {
    const { productId, locationId, type, startDate, endDate, page = 1, limit = 50 } = req.query;

    const result = await getStockMoves({
      productId,
      locationId,
      type,
      startDate,
      endDate,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get stock moves error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getStockMovesController,
};
