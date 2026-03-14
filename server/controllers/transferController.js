const {
  createTransfer,
  validateTransfer,
} = require("../services/transferService");

/**
 * CREATE TRANSFER
 */
const createTransferController = async (req, res) => {
  try {
    const { fromLocationId, toLocationId, lines } = req.body;

    if (!fromLocationId || !toLocationId || !lines || lines.length === 0) {
      return res.status(400).json({ error: "fromLocationId, toLocationId, and lines are required" });
    }

    const result = await createTransfer({
      fromLocationId,
      toLocationId,
      lines,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error) {
    console.error("Create transfer error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * VALIDATE TRANSFER - Atomic swap
 */
const validateTransferController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res.status(400).json({ error: "Transfer ID is required" });
    }

    const result = await validateTransfer(id, userId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error("Validate transfer error:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createTransferController,
  validateTransferController,
};
