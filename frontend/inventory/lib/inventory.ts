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
  if (filters.type !== "All" && entry.type !== filters.type) return false;
  if (filters.status !== "All" && entry.status !== filters.status) return false;
  if (filters.warehouse !== "All" && entry.warehouse !== filters.warehouse) return false;
  if (filters.category !== "All" && entry.category !== filters.category) return false;
  return true;
}

export function buildKpis(products: Product[], ledger: LedgerEntry[]): DashboardKpis {
  const totalProductsInStock = products.reduce((total, p) => total + getTotalStock(p), 0);

  const outOfStockItems = products.filter((p) => getTotalStock(p) === 0).length;
  const lowStockItems = products.filter((p) => {
    const totalStock = getTotalStock(p);
    return totalStock > 0 && totalStock <= p.reorderPoint;
  }).length;

  // Use a Set for faster lookup if list of statuses grows
  const isPending = (status: LedgerEntry["status"]) => 
    ["Draft", "Waiting", "Ready"].includes(status);

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
    if (product.id !== entry.productId) return product;

    // Create a deep copy of stock location map to maintain immutability
    const nextStock = { ...product.stockByLocation };

    const updateStock = (warehouse: string, location: string, delta: number) => {
      const key = getLocationKey(warehouse, location);
      nextStock[key] = Math.max(0, (nextStock[key] ?? 0) + delta);
    };

    switch (entry.type) {
      case "Receipts":
        updateStock(entry.warehouse, entry.location, entry.quantity);
        break;

      case "Delivery":
        updateStock(entry.warehouse, entry.location, -entry.quantity);
        break;

      case "Adjustments":
        updateStock(entry.warehouse, entry.location, entry.quantity);
        break;

      case "Internal":
        const from = entry.fromLocation ?? entry.location;
        const to = entry.toLocation ?? entry.location;
        updateStock(entry.warehouse, from, -entry.quantity);
        updateStock(entry.warehouse, to, entry.quantity);
        break;
    }

    return {
      ...product,
      stockByLocation: nextStock,
    };
  });
}