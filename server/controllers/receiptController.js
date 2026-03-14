const {
  getAllReceipts,
  createReceipt,
  validateReceipt,
} = require("../services/receiptService");

/**
 * GET ALL RECEIPTS
 */
const getAllReceiptsController = async (req, res) => {
  try {
    const { status, warehouseId, page = 1, limit = 20 } = req.query;

    const result = await getAllReceipts({
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
    console.error("Get receipts error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * CREATE RECEIPT
 */
const createReceiptController = async (req, res) => {
  try {
    const { supplierId, warehouseId, scheduledDate, lines } = req.body;

    if (!warehouseId || !lines || lines.length === 0) {
      return res.status(400).json({ error: "warehouseId and lines are required" });
    }

    const result = await createReceipt({
      supplierId,
      warehouseId,
      scheduledDate,
      lines,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Create receipt error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * VALIDATE RECEIPT - Stock increases atomically
 */
const validateReceiptController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "Receipt ID is required" });
    }

    const result = await validateReceipt(id, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Validate receipt error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllReceiptsController,
  createReceiptController,
  validateReceiptController,
};
