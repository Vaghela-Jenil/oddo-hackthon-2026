const prisma = require("../config/prisma");
const { resolveWarehouseId, resolveLocationId } = require("../utils/entityResolver");

/**
 * GET ALL DELIVERIES
 */
const getAllDeliveries = async (filters) => {
  try {
    const { status, warehouseId, page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (warehouseId) where.warehouseId = warehouseId;

    const deliveries = await prisma.deliveryOrder.findMany({
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

    const total = await prisma.deliveryOrder.count({ where });

    return {
      success: true,
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error("Get deliveries error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * CREATE DELIVERY
 */
const createDelivery = async (deliveryData) => {
  try {
    const { customerId, scheduledDate, lines } = deliveryData;
    let { warehouseId } = deliveryData;

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
          requestedQty: parseFloat(line.requestedQty || 0),
          deliveredQty: parseFloat(line.deliveredQty || 0),
        })),
      );
    } catch (e) {
      return { success: false, error: `Location resolution failed: ${e.message}` };
    }

    // Create delivery with lines
    const delivery = await prisma.deliveryOrder.create({
      data: {
        customerId,
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
      message: "Delivery created successfully",
      data: delivery,
    };
  } catch (error) {
    console.error("Create delivery error:", error);
    return { success: false, error: error.message };
  }
};

/**
 * VALIDATE DELIVERY - Atomic stock decrease
 */
const validateDelivery = async (deliveryId, userId) => {
  try {
    const delivery = await prisma.deliveryOrder.findUnique({
      where: { id: deliveryId },
      include: {
        lines: {
          include: {
            product: true,
            location: true,
          },
        },
      },
    });

    if (!delivery) {
      return { success: false, error: "Delivery not found" };
    }

    if (delivery.status !== "DRAFT") {
      return { success: false, error: "Only DRAFT deliveries can be validated" };
    }

    // Wrap in transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if sufficient stock exists
      for (const line of delivery.lines) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.locationId,
            },
          },
        });

        if (!balance || balance.quantity < line.deliveredQty) {
          throw new Error(`Insufficient stock for product ${line.product.sku}`);
        }
      }

      // Update delivery status
      const updatedDelivery = await tx.deliveryOrder.update({
        where: { id: deliveryId },
        data: { status: "READY" },
      });

      // Create stock moves for each line
      for (const line of delivery.lines) {
        // Update stock balance
        await tx.stockBalance.update({
          where: {
            productId_locationId: {
              productId: line.productId,
              locationId: line.locationId,
            },
          },
          data: {
            quantity: {
              decrement: line.deliveredQty,
            },
          },
        });

        // Create stock move
        await tx.stockMove.create({
          data: {
            productId: line.productId,
            qty: line.deliveredQty,
            type: "DELIVERY",
            fromLocationId: line.locationId,
            referenceId: deliveryId,
            refType: "delivery",
            createdBy: userId,
          },
        });
      }

      return updatedDelivery;
    });

    return {
      success: true,
      message: "Delivery validated successfully",
      data: result,
    };
  } catch (error) {
    console.error("Validate delivery error:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAllDeliveries,
  createDelivery,
  validateDelivery,
};
