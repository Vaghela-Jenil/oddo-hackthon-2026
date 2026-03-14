const prisma = require("../config/prisma");
const { resolveWarehouseId, resolveLocationId } = require("../utils/entityResolver");

/**
 * GET ALL RECEIPTS
 */
const getAllReceipts = async (filters) => {
  try {
    const { status, warehouseId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const receipts = await prisma.receipt.findMany({
      where,
      skip,
      take: limit,
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.receipt.count({ where });

    return {
      success: true,
      data: receipts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get receipts error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * CREATE RECEIPT
 */
const createReceipt = async (receiptData) => {
  try {
    const { supplierId, scheduledDate, lines } = receiptData;
    let { warehouseId } = receiptData;

    // Resolve warehouse – accept UUID or name
    try {
      warehouseId = await resolveWarehouseId(warehouseId);
    } catch (e) {
      return { success: false, error: `Warehouse resolution failed: ${e.message}` };
    }

    // Resolve each line’s locationId from name if necessary
    let resolvedLines;
    try {
      resolvedLines = await Promise.all(
        lines.map(async (line) => ({
          productId: line.productId,
          locationId: await resolveLocationId(line.locationId, warehouseId),
          expectedQty: parseFloat(line.expectedQty),
          receivedQty: 0,
        })),
      );
    } catch (e) {
      return { success: false, error: `Location resolution failed: ${e.message}` };
    }

    // Create receipt with lines
    const receipt = await prisma.receipt.create({
      data: {
        supplierId,
        warehouseId,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        lines: {
          create: resolvedLines,
        },
      },
      include: {
        warehouse: true,
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Receipt created successfully",
      data: receipt,
    };
  } catch (error) {
    console.error("Create receipt error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * VALIDATE RECEIPT - Atomic stock increase
 */
const validateReceipt = async (receiptId, userId) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });

    if (!receipt) {
      return { success: false, error: "Receipt not found" };
    }

    if (receipt.status !== "DRAFT") {
      return { success: false, error: "Only DRAFT receipts can be validated" };
    }

    // Wrap in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update receipt status
      const updatedReceipt = await tx.receipt.update({
        where: { id: receiptId },
        data: { status: "READY" },
      });

      // Create stock moves for each line
      for (const line of receipt.lines) {
        // Update stock balance
        const existingBalance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.locationId,
            },
          },
        });

        if (existingBalance) {
          await tx.stockBalance.update({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId: line.locationId,
              },
            },
            data: {
              quantity: existingBalance.quantity + line.receivedQty,
            },
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.receivedQty,
            },
          });
        }

        // Create stock move
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            qty: line.receivedQty,
            type: "RECEIPT",
            toLocationId: line.locationId,
            referenceId: receiptId,
            refType: "receipt",
            createdBy: userId,
          },
        });
      }

      return updatedReceipt;
    });

    return {
      success: true,
      message: "Receipt validated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Validate receipt error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAllReceipts,
  createReceipt,
  validateReceipt,
};
