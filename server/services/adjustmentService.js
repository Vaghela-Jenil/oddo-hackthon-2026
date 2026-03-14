const prisma = require("../config/prisma");

/**
 * VALIDATE ADJUSTMENT - Create correction moves
 */
const validateAdjustment = async (adjustmentId, userId) => {
  try {
    const adjustment = await prisma.adjustment.findUnique({
      where: { id: adjustmentId },
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });

    if (!adjustment) {
      return { success: false, error: "Adjustment not found" };
    }

    if (adjustment.status !== "DRAFT") {
      return { success: false, error: "Only DRAFT adjustments can be validated" };
    }

    // Wrap in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update adjustment status
      const updatedAdjustment = await tx.adjustment.update({
        where: { id: adjustmentId },
        data: { status: "DONE" },
      });

      // Create correction moves for each line
      for (const line of adjustment.lines) {
        const currentBalance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.locationId,
            },
          },
        });

        const currentQty = currentBalance?.quantity || 0;
        const difference = line.adjustedQty - currentQty;

        // Update stock balance to adjusted quantity
        if (currentBalance) {
          await tx.stockBalance.update({
            where: {
              productId_locationId: {
                productId: line.productId,
                locationId: line.locationId,
              },
            },
            data: {
              quantity: line.adjustedQty,
            },
          });
        } else {
          await tx.stockBalance.create({
            data: {
              productId: line.productId,
              locationId: line.locationId,
              quantity: line.adjustedQty,
            },
          });
        }

        // Create stock move for the difference
        if (difference !== 0) {
          await tx.stockMove.create({
            data: {
              productId: line.productId,
              qty: Math.abs(difference),
              type: "ADJUSTMENT",
              [difference > 0 ? "toLocationId" : "fromLocationId"]: line.locationId,
              referenceId: adjustmentId,
              refType: "adjustment",
              note: line.reason || "Stock adjustment",
              createdBy: userId,
            },
          });
        }
      }

      return updatedAdjustment;
    });

    return {
      success: true,
      message: "Adjustment validated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Validate adjustment error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  validateAdjustment,
};
