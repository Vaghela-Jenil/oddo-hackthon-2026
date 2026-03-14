/**
 * Entity Resolver – accept either a UUID or a human-readable name for
 * Warehouse, Location, and Category.  When a name is supplied the entity is
 * looked up by name first; if missing it is created automatically so the UI
 * never has to pre-seed the database before making API calls.
 */

const prisma = require("../config/prisma");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value) {
  return UUID_RE.test(String(value || ""));
}

/**
 * Resolve warehouse – accepts a UUID or a name string.
 * Creates the warehouse when the name is not yet in the DB.
 * @param {string} nameOrId
 * @param {object} [tx] – optional Prisma transaction client
 * @returns {Promise<string>} resolved warehouse UUID
 */
async function resolveWarehouseId(nameOrId, tx) {
  if (!nameOrId) throw new Error("Warehouse name or ID is required");
  if (isUuid(nameOrId)) return nameOrId;

  const db = tx || prisma;
  let warehouse = await db.warehouse.findFirst({ where: { name: nameOrId } });

  if (!warehouse) {
    warehouse = await db.warehouse.create({ data: { name: nameOrId } });
  }

  return warehouse.id;
}

/**
 * Resolve location – accepts a UUID or a name string.
 * When a name is supplied, warehouseId is used to scope the lookup and
 * creation.  If warehouseId is omitted a global name search is attempted;
 * an error is thrown if the location is not found and cannot be created.
 * @param {string} nameOrId
 * @param {string|null} [warehouseId]
 * @param {object} [tx]
 * @returns {Promise<string>} resolved location UUID
 */
async function resolveLocationId(nameOrId, warehouseId, tx) {
  if (!nameOrId) throw new Error("Location name or ID is required");
  if (isUuid(nameOrId)) return nameOrId;

  const db = tx || prisma;

  if (warehouseId) {
    let location = await db.location.findFirst({
      where: { name: nameOrId, warehouseId },
    });

    if (!location) {
      location = await db.location.create({
        data: { name: nameOrId, warehouseId },
      });
    }

    return location.id;
  }

  // No warehouse context – search globally
  const location = await db.location.findFirst({ where: { name: nameOrId } });

  if (!location) {
    throw new Error(
      `Location "${nameOrId}" not found and no warehouse provided for auto-creation`,
    );
  }

  return location.id;
}

/**
 * Resolve category – accepts a UUID or a name string.
 * Creates the category when the name is not yet in the DB.
 * @param {string} nameOrId
 * @param {object} [tx]
 * @returns {Promise<string>} resolved category UUID
 */
async function resolveCategoryId(nameOrId, tx) {
  if (!nameOrId) throw new Error("Category name or ID is required");
  if (isUuid(nameOrId)) return nameOrId;

  const db = tx || prisma;
  let category = await db.category.findFirst({ where: { name: nameOrId } });

  if (!category) {
    category = await db.category.create({ data: { name: nameOrId } });
  }

  return category.id;
}

module.exports = { resolveWarehouseId, resolveLocationId, resolveCategoryId };
