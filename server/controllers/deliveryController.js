const {
  getAllDeliveries,
  createDelivery,
  validateDelivery,
} = require("../services/deliveryService");

/**
 * GET ALL DELIVERIES
 */
const getAllDeliveriesController = async (req, res) => {
  try {
    const { status, warehouseId, page = 1, limit = 20 } = req.query;

    const result = await getAllDeliveries({
      status,
      warehouseId,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Get deliveries error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * CREATE DELIVERY
 */
const createDeliveryController = async (req, res) => {
  try {
    const { customerId, warehouseId, scheduledDate, lines } = req.body;

    if (!warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: "warehouseId and lines are required" });
    }

    const result = await createDelivery({
      customerId,
      warehouseId,
      scheduledDate,
      lines,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Create delivery error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * VALIDATE DELIVERY - Stock decreases atomically
 */
const validateDeliveryController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "Delivery ID is required" });
    }

    const result = await validateDelivery(id, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Validate delivery error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllDeliveriesController,
  createDeliveryController,
  validateDeliveryController,
};
