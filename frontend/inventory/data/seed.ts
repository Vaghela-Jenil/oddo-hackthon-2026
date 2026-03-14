import type { LedgerEntry, Product, Warehouse } from "@/types/inventory";

export const initialWarehouses: Warehouse[] = [
  {
    id: "w-main",
    name: "Main Warehouse",
    locations: ["Rack A", "Rack B", "Production Floor"],
  },
  {
    id: "w-secondary",
    name: "Warehouse 2",
    locations: ["Inbound", "Storage Zone"],
  },
];

export const initialProducts: Product[] = [
  {
    id: "p-1",
    name: "Steel Rods",
    sku: "STL-ROD-001",
    category: "Raw Materials",
    unit: "kg",
    reorderPoint: 30,
    stockByLocation: {
      "Main Warehouse::Rack A": 100,
      "Main Warehouse::Production Floor": 20,
    },
  },
  {
    id: "p-2",
    name: "Office Chair",
    sku: "CHR-OF-010",
    category: "Finished Goods",
    unit: "units",
    reorderPoint: 10,
    stockByLocation: {
      "Main Warehouse::Rack B": 8,
      "Warehouse 2::Storage Zone": 4,
    },
  },
  {
    id: "p-3",
    name: "Bolt Pack",
    sku: "BLT-PK-077",
    category: "Hardware",
    unit: "packs",
    reorderPoint: 20,
    stockByLocation: {
      "Warehouse 2::Inbound": 0,
    },
  },
];

export const initialLedger: LedgerEntry[] = [
  {
    id: "l-1",
    type: "Receipts",
    status: "Done",
    reference: "RCPT-1001",
    productId: "p-1",
    productName: "Steel Rods",
    category: "Raw Materials",
    warehouse: "Main Warehouse",
    location: "Rack A",
    quantity: 100,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    notes: "Vendor delivery",
  },
  {
    id: "l-2",
    type: "Internal",
    status: "Ready",
    reference: "INT-2033",
    productId: "p-1",
    productName: "Steel Rods",
    category: "Raw Materials",
    warehouse: "Main Warehouse",
    location: "Production Floor",
    quantity: 20,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    fromLocation: "Rack A",
    toLocation: "Production Floor",
    notes: "Scheduled for assembly",
  },
  {
    id: "l-3",
    type: "Delivery",
    status: "Waiting",
    reference: "DLV-3021",
    productId: "p-2",
    productName: "Office Chair",
    category: "Finished Goods",
    warehouse: "Main Warehouse",
    location: "Rack B",
    quantity: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    notes: "Customer shipment pending",
  },
];
