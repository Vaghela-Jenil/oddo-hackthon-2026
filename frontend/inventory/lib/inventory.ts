import type {
  DashboardFilters,
  DashboardKpis,
  LedgerEntry,
  OperationType,
  Product,
} from "@/types/inventory";

export function getLocationKey(warehouse: string, location: string): string {
  return `${warehouse}::${location}`;
}

export function getTotalStock(product: Product): number {
  return Object.values(product.stockByLocation).reduce((sum, qty) => sum + qty, 0);
}

export function getCategories(products: Product[]): string[] {
  return Array.from(new Set(products.map((product) => product.category))).sort();
}

export function matchesFilters(entry: LedgerEntry, filters: DashboardFilters): boolean {
  if (filters.type !== "All" && entry.type !== filters.type) {
    return false;
  }

  if (filters.status !== "All" && entry.status !== filters.status) {
    return false;
  }

  if (filters.warehouse !== "All" && entry.warehouse !== filters.warehouse) {
    return false;
  }

  if (filters.category !== "All" && entry.category !== filters.category) {
    return false;
  }

  return true;
}

export function buildKpis(products: Product[], ledger: LedgerEntry[]): DashboardKpis {
  const totalProductsInStock = products.reduce((total, product) => total + getTotalStock(product), 0);

  const outOfStockItems = products.filter((product) => getTotalStock(product) === 0).length;
  const lowStockItems = products.filter((product) => {
    const totalStock = getTotalStock(product);
    return totalStock > 0 && totalStock <= product.reorderPoint;
  }).length;

  const isPending = (status: LedgerEntry["status"]) => status === "Draft" || status === "Waiting" || status === "Ready";

  const countPendingByType = (type: OperationType) =>
    ledger.filter((entry) => entry.type === type && isPending(entry.status)).length;

  return {
    totalProductsInStock,
    lowStockItems,
    outOfStockItems,
    pendingReceipts: countPendingByType("Receipts"),
    pendingDeliveries: countPendingByType("Delivery"),
    internalTransfersScheduled: countPendingByType("Internal"),
  };
}

export function applyValidatedLedgerEntry(products: Product[], entry: LedgerEntry): Product[] {
  return products.map((product) => {
    if (product.id !== entry.productId) {
      return product;
    }

    const nextStock = { ...product.stockByLocation };

    if (entry.type === "Receipts") {
      const key = getLocationKey(entry.warehouse, entry.location);
      nextStock[key] = (nextStock[key] ?? 0) + entry.quantity;
    }

    if (entry.type === "Delivery") {
      const key = getLocationKey(entry.warehouse, entry.location);
      nextStock[key] = Math.max(0, (nextStock[key] ?? 0) - entry.quantity);
    }

    if (entry.type === "Adjustments") {
      const key = getLocationKey(entry.warehouse, entry.location);
      nextStock[key] = Math.max(0, (nextStock[key] ?? 0) + entry.quantity);
    }

    if (entry.type === "Internal") {
      const fromLocation = entry.fromLocation ?? entry.location;
      const toLocation = entry.toLocation ?? entry.location;

      const fromKey = getLocationKey(entry.warehouse, fromLocation);
      const toKey = getLocationKey(entry.warehouse, toLocation);

      nextStock[fromKey] = Math.max(0, (nextStock[fromKey] ?? 0) - entry.quantity);
      nextStock[toKey] = (nextStock[toKey] ?? 0) + entry.quantity;
    }

    return {
      ...product,
      stockByLocation: nextStock,
    };
  });
}
