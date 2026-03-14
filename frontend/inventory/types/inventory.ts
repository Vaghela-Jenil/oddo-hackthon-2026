export type OperationType = "Receipts" | "Delivery" | "Internal" | "Adjustments";

export type OperationStatus = "Draft" | "Waiting" | "Ready" | "Done" | "Canceled";

export interface Warehouse {
  id: string;
  name: string;
  locations: string[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderPoint: number;
  stockByLocation: Record<string, number>;
}

export interface LedgerEntry {
  id: string;
  type: OperationType;
  status: OperationStatus;
  reference: string;
  productId: string;
  productName: string;
  category: string;
  warehouse: string;
  location: string;
  quantity: number;
  timestamp: string;
  notes?: string;
  fromLocation?: string;
  toLocation?: string;
}

export interface DashboardFilters {
  type: "All" | OperationType;
  status: "All" | OperationStatus;
  warehouse: "All" | string;
  category: "All" | string;
}

export interface DashboardKpis {
  totalProductsInStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfersScheduled: number;
}
