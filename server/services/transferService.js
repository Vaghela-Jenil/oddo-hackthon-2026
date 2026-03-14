const prisma = require("../config/prisma");
const { resolveWarehouseId, resolveLocationId } = require("../utils/entityResolver");

/**
 * CREATE TRANSFER
 */
const createTransfer = async (transferData) => {
  try {
    const { lines, fromWarehouse, toWarehouse } = transferData;
    let { fromLocationId, toLocationId } = transferData;

    // Resolve from-location – accept UUID or name+warehouse
    try {
      if (fromWarehouse) {
        const fromWarehouseId = await resolveWarehouseId(fromWarehouse);
        fromLocationId = await resolveLocationId(fromLocationId, fromWarehouseId);
      } else {
        fromLocationId = await resolveLocationId(fromLocationId, null);
      }
    } catch (e) {
      return { success: false, error: `From-location resolution failed: ${e.message}` };
    }

    // Resolve to-location
    try {
      if (toWarehouse) {
        const toWarehouseId = await resolveWarehouseId(toWarehouse);
        toLocationId = await resolveLocationId(toLocationId, toWarehouseId);
      } else {
        toLocationId = await resolveLocationId(toLocationId, null);
      }
    } catch (e) {
      return { success: false, error: `To-location resolution failed: ${e.message}` };
    }

    // Verify locations exist
    const fromLocation = await prisma.location.findUnique({ where: { id: fromLocationId } });
    const toLocation = await prisma.location.findUnique({ where: { id: toLocationId } });

    if (!fromLocation || !toLocation) {
      return { success: false, error: "One or both locations not found" };
    }

    // Create transfer with lines
    const transfer = await prisma.transfer.create({
      data: {
        fromLocationId,
        toLocationId,
        status: "DRAFT",
        lines: {
          create: lines.map(line => ({
            productId: line.productId,
            qty: parseFloat(line.qty),
          })),
        },
      },
      include: {
        fromLocation: true,
        toLocation: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    return {
      success: true,
      message: "Transfer created successfully",
      data: transfer,
    };
  } catch (error) {
    console.error("Create transfer error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * VALIDATE TRANSFER - Atomic stock swap
 */
const validateTransfer = async (transferId, userId) => {
  try {
    const transfer = await prisma.transfer.findUnique({
      where: { id: transferId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!transfer) {
      return { success: false, error: "Transfer not found" };
    }

    if (transfer.status !== "DRAFT") {
      return { success: false, error: "Only DRAFT transfers can be validated" };
    }

    // Wrap in transaction for atomicity (atomic swap)
    const result = await prisma.$transaction(async (tx) => {
      // Check if sufficient stock exists in source location
      for (const line of transfer.lines) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
        });

        if (!balance || balance.quantity < line.qty) {
          throw new Error(`Insufficient stock for product ${line.product.sku} in source location`);
        }
      }

      // Update transfer status
      const updatedTransfer = await tx.transfer.update({
        where: { id: transferId },
        data: { status: "DONE" },
      });

      // Execute atomic swap for each line
      for (const line of transfer.lines) {
        // Decrease stock from source location
        await tx.stockBalance.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.fromLocationId,
            },
          },
          data: {
            quantity: {
              decrement: line.qty,
            },
          },
        });

        // Increase stock at destination location
        const existingBalance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: transfer.toLocationId,
            },
          },
        });

        if (existingBalance) {
          await tx.stockBalance.update({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId: transfer.toLocationId,
              },
            },
            data: {
              quantity: existingBalance.quantity + line.qty,
            },
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: line.productId,
              locationId: transfer.toLocationId,
              quantity: line.qty,
            },
          });
        }

        // Create stock moves
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            qty: line.qty,
            type: "TRANSFER",
            fromLocationId: transfer.fromLocationId,
            toLocationId: transfer.toLocationId,
            referenceId: transferId,
            refType: "transfer",
            createdBy: userId,
          },
        });
      }

      return updatedTransfer;
    });

    return {
      success: true,
      message: "Transfer validated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Validate transfer error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * GET ALL TRANSFERS
 */
const getAllTransfers = async (filters) => {
  try {
    const { page = 1, limit = 20, status } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;

    const transfers = await prisma.transfer.findMany({
      where,
      skip,
      take: limit,
      include: {
        fromLocation: {
          include: {
            warehouse: true,
          },
        },
        toLocation: {
          include: {
            warehouse: true,
          },
        },
        lines: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const total = await prisma.transfer.count({ where });

    return {
      success: true,
      data: transfers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get transfers error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createTransfer,
  validateTransfer,
  getAllTransfers,
};
