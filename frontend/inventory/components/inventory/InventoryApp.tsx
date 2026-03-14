"use client";

import { useMemo, useState } from "react";
import { AuthPanel } from "@/components/inventory/AuthPanel";
import { Sidebar, type NavigationKey } from "@/components/inventory/Sidebar";
import { initialLedger, initialProducts, initialWarehouses } from "@/data/seed";
import {
  applyValidatedLedgerEntry,
  buildKpis,
  getCategories,
  getLocationKey,
  getTotalStock,
  matchesFilters,
} from "@/lib/inventory";
import { isNonNegativeNumber, isPositiveNumber, isValidLabel, isValidSku, sanitizeText } from "@/lib/validators";
import type { DashboardFilters, LedgerEntry, OperationType, Product, Warehouse } from "@/types/inventory";

interface ProductFormState {
  id?: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  reorderPoint: number;
  warehouse: string;
  location: string;
  initialStock: number;
}

interface OperationFormState {
  productId: string;
  warehouse: string;
  location: string;
  fromLocation: string;
  toLocation: string;
  quantity: number;
  notes: string;
}

const DEFAULT_FILTERS: DashboardFilters = {
  type: "All",
  status: "All",
  warehouse: "All",
  category: "All",
};

const DEFAULT_PRODUCT_FORM: ProductFormState = {
  name: "",
  sku: "",
  category: "",
  unit: "units",
  reorderPoint: 10,
  warehouse: "Main Warehouse",
  location: "Rack A",
  initialStock: 0,
};

const DEFAULT_OPERATION_FORM: OperationFormState = {
  productId: "",
  warehouse: "Main Warehouse",
  location: "Rack A",
  fromLocation: "Rack A",
  toLocation: "Rack B",
  quantity: 1,
  notes: "",
};

function refPrefix(type: OperationType): string {
  if (type === "Receipts") {
    return "RCPT";
  }
  if (type === "Delivery") {
    return "DLV";
  }
  if (type === "Internal") {
    return "INT";
  }
  return "ADJ";
}

function operationTitle(view: NavigationKey): OperationType | null {
  if (view === "Receipts") {
    return "Receipts";
  }
  if (view === "Delivery") {
    return "Delivery";
  }
  if (view === "Internal") {
    return "Internal";
  }
  if (view === "Adjustments") {
    return "Adjustments";
  }
  return null;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function StatusBadge({ status }: { status: LedgerEntry["status"] }) {
  const style =
    status === "Done"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Canceled"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-700";

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${style}`}>{status}</span>;
}

function KpiCard({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs text-zinc-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {subtitle && <p className="mt-2 text-xs text-zinc-500">{subtitle}</p>}
    </article>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function getWarehouseLocations(warehouses: Warehouse[], selectedWarehouse: string): string[] {
  return warehouses.find((warehouse) => warehouse.name === selectedWarehouse)?.locations ?? [];
}

export function InventoryApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileName, setProfileName] = useState("Inventory Manager");
  const [activeView, setActiveView] = useState<NavigationKey>("Dashboard");

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [ledger, setLedger] = useState<LedgerEntry[]>(initialLedger);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);

  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductFormState>(DEFAULT_PRODUCT_FORM);
  const [operationForm, setOperationForm] = useState<OperationFormState>(DEFAULT_OPERATION_FORM);

  const [warehouseNameInput, setWarehouseNameInput] = useState("");
  const [locationWarehouseInput, setLocationWarehouseInput] = useState("Main Warehouse");
  const [locationNameInput, setLocationNameInput] = useState("");
  const [bannerMessage, setBannerMessage] = useState<string>("");

  const categories = useMemo(() => getCategories(products), [products]);
  const kpis = useMemo(() => buildKpis(products, ledger), [products, ledger]);

  const filteredLedger = useMemo(
    () => ledger.filter((entry) => matchesFilters(entry, filters)).sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [ledger, filters],
  );

  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLowerCase();
    if (!query) {
      return products;
    }

    return products.filter((product) =>
      `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query),
    );
  }, [products, productSearch]);

  const activeOperationType = operationTitle(activeView);
  const operationLocations = getWarehouseLocations(warehouses, operationForm.warehouse);

  const authenticate = (name: string) => {
    setProfileName(name);
    setIsAuthenticated(true);
    setActiveView("Dashboard");
    setBannerMessage("Authentication successful. Redirected to Inventory Dashboard.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setBannerMessage("You have been logged out.");
  };

  const upsertProduct = () => {
    const normalizedName = sanitizeText(productForm.name);
    const normalizedCategory = sanitizeText(productForm.category);
    const normalizedUnit = sanitizeText(productForm.unit);
    const normalizedSku = productForm.sku.trim().toUpperCase();

    if (!isValidLabel(normalizedName) || !isValidLabel(normalizedCategory) || !isValidLabel(normalizedUnit, 2, 20)) {
      setBannerMessage("Invalid product fields. Use alphanumeric labels and valid lengths.");
      return;
    }

    if (!isValidSku(normalizedSku) || !isNonNegativeNumber(productForm.reorderPoint) || !isNonNegativeNumber(productForm.initialStock)) {
      setBannerMessage("SKU and numeric values are invalid.");
      return;
    }

    const locationKey = getLocationKey(productForm.warehouse, productForm.location);

    if (productForm.id) {
      setProducts((current) =>
        current.map((product) =>
          product.id === productForm.id
            ? {
                ...product,
                name: normalizedName,
                sku: normalizedSku,
                category: normalizedCategory,
                unit: normalizedUnit,
                reorderPoint: productForm.reorderPoint,
                stockByLocation: {
                  ...product.stockByLocation,
                  [locationKey]: (product.stockByLocation[locationKey] ?? 0) + productForm.initialStock,
                },
              }
            : product,
        ),
      );
      setBannerMessage(`Product ${normalizedName} updated.`);
    } else {
      setProducts((current) => [
        {
          id: `p-${Date.now()}`,
          name: normalizedName,
          sku: normalizedSku,
          category: normalizedCategory,
          unit: normalizedUnit,
          reorderPoint: productForm.reorderPoint,
          stockByLocation: {
            [locationKey]: productForm.initialStock,
          },
        },
        ...current,
      ]);
      setBannerMessage(`Product ${normalizedName} created.`);
    }

    setProductForm({
      ...DEFAULT_PRODUCT_FORM,
      warehouse: productForm.warehouse,
      location: productForm.location,
    });
  };

  const selectProductForEdit = (product: Product) => {
    const firstStockEntry = Object.entries(product.stockByLocation)[0];
    const [warehouse = "Main Warehouse", location = "Rack A"] = firstStockEntry
      ? firstStockEntry[0].split("::")
      : ["Main Warehouse", "Rack A"];

    setProductForm({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      unit: product.unit,
      reorderPoint: product.reorderPoint,
      warehouse,
      location,
      initialStock: 0,
    });

    setActiveView("Products");
  };

  const createOperation = () => {
    if (!activeOperationType) {
      return;
    }

    const selectedProduct = products.find((product) => product.id === operationForm.productId);

    if (!selectedProduct) {
      setBannerMessage("Select a product before creating an operation.");
      return;
    }

    const quantityIsValid =
      activeOperationType === "Adjustments"
        ? Number.isFinite(operationForm.quantity) && operationForm.quantity !== 0
        : isPositiveNumber(operationForm.quantity);

    if (!quantityIsValid) {
      setBannerMessage("Quantity must be valid for the selected operation.");
      return;
    }

    if (activeOperationType === "Internal" && operationForm.fromLocation === operationForm.toLocation) {
      setBannerMessage("From and To locations must be different for internal transfer.");
      return;
    }

    const entry: LedgerEntry = {
      id: `l-${Date.now()}`,
      type: activeOperationType,
      status: "Draft",
      reference: `${refPrefix(activeOperationType)}-${Math.floor(1000 + Math.random() * 9000)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      category: selectedProduct.category,
      warehouse: operationForm.warehouse,
      location: activeOperationType === "Internal" ? operationForm.toLocation : operationForm.location,
      quantity: operationForm.quantity,
      timestamp: new Date().toISOString(),
      notes: sanitizeText(operationForm.notes),
      fromLocation: activeOperationType === "Internal" ? operationForm.fromLocation : undefined,
      toLocation: activeOperationType === "Internal" ? operationForm.toLocation : undefined,
    };

    setLedger((current) => [entry, ...current]);
    setBannerMessage(`${activeOperationType} ${entry.reference} created as Draft.`);
    setOperationForm((current) => ({
      ...current,
      notes: "",
      quantity: activeOperationType === "Adjustments" ? -1 : 1,
    }));
  };

  const validateOperation = (entryId: string) => {
    const target = ledger.find((entry) => entry.id === entryId);

    if (!target || target.status === "Done" || target.status === "Canceled") {
      return;
    }

    const selectedProduct = products.find((product) => product.id === target.productId);
    if (!selectedProduct) {
      setBannerMessage("Product not found for this operation.");
      return;
    }

    if (target.type === "Delivery") {
      const currentStock = selectedProduct.stockByLocation[getLocationKey(target.warehouse, target.location)] ?? 0;
      if (currentStock < target.quantity) {
        setBannerMessage("Delivery validation failed: insufficient stock at selected location.");
        return;
      }
    }

    if (target.type === "Internal") {
      const fromLocation = target.fromLocation ?? target.location;
      const currentStock = selectedProduct.stockByLocation[getLocationKey(target.warehouse, fromLocation)] ?? 0;
      if (currentStock < target.quantity) {
        setBannerMessage("Transfer validation failed: insufficient stock at source location.");
        return;
      }
    }

    setProducts((current) => applyValidatedLedgerEntry(current, target));
    setLedger((current) => current.map((entry) => (entry.id === entryId ? { ...entry, status: "Done" } : entry)));
    setBannerMessage(`Operation ${target.reference} validated. Stock ledger and quantities updated.`);
  };

  const addWarehouse = () => {
    const name = sanitizeText(warehouseNameInput);
    if (!isValidLabel(name) || warehouses.some((warehouse) => warehouse.name.toLowerCase() === name.toLowerCase())) {
      setBannerMessage("Warehouse name is invalid or already exists.");
      return;
    }

    setWarehouses((current) => [...current, { id: `w-${Date.now()}`, name, locations: ["General"] }]);
    setWarehouseNameInput("");
    setBannerMessage(`Warehouse ${name} added.`);
  };

  const addLocation = () => {
    const location = sanitizeText(locationNameInput);

    if (!isValidLabel(location)) {
      setBannerMessage("Location name is invalid.");
      return;
    }

    setWarehouses((current) =>
      current.map((warehouse) =>
        warehouse.name === locationWarehouseInput
          ? {
              ...warehouse,
              locations: warehouse.locations.includes(location)
                ? warehouse.locations
                : [...warehouse.locations, location],
            }
          : warehouse,
      ),
    );

    setLocationNameInput("");
    setBannerMessage(`Location ${location} added to ${locationWarehouseInput}.`);
  };

  if (!isAuthenticated) {
    return <AuthPanel onAuthenticated={authenticate} />;
  }

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        <Sidebar activeView={activeView} onNavigate={setActiveView} onLogout={handleLogout} profileName={profileName} />

        <main className="flex-1 p-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{activeView}</h1>
              <p className="text-sm text-zinc-500">Real-time modular inventory control workspace.</p>
            </div>
            <button
              type="button"
              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100"
              onClick={() => setActiveView("Dashboard")}
            >
              Go to Dashboard
            </button>
          </header>

          {bannerMessage && (
            <div className="mb-4 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
              {bannerMessage}
            </div>
          )}

          {activeView === "Dashboard" && (
            <div className="space-y-4">
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <KpiCard title="Total Products in Stock" value={kpis.totalProductsInStock} subtitle="Across all warehouses" />
                <KpiCard
                  title="Low / Out of Stock"
                  value={`${kpis.lowStockItems} / ${kpis.outOfStockItems}`}
                  subtitle="Reorder attention required"
                />
                <KpiCard title="Pending Receipts" value={kpis.pendingReceipts} />
                <KpiCard title="Pending Deliveries" value={kpis.pendingDeliveries} />
                <KpiCard title="Internal Transfers Scheduled" value={kpis.internalTransfersScheduled} />
              </section>

              <SectionCard title="Dynamic Filters">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <select
                    value={filters.type}
                    onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value as DashboardFilters["type"] }))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="All">All document types</option>
                    <option value="Receipts">Receipts</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Internal">Internal</option>
                    <option value="Adjustments">Adjustments</option>
                  </select>
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as DashboardFilters["status"] }))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="All">All status</option>
                    <option value="Draft">Draft</option>
                    <option value="Waiting">Waiting</option>
                    <option value="Ready">Ready</option>
                    <option value="Done">Done</option>
                    <option value="Canceled">Canceled</option>
                  </select>
                  <select
                    value={filters.warehouse}
                    onChange={(event) => setFilters((current) => ({ ...current, warehouse: event.target.value }))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="All">All warehouses</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={filters.category}
                    onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="All">All categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </SectionCard>

              <SectionCard title="Operations Snapshot">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="border-b border-zinc-200 text-zinc-500">
                      <tr>
                        <th className="py-2">Ref</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Product</th>
                        <th className="py-2">Warehouse / Location</th>
                        <th className="py-2">Qty</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLedger.slice(0, 12).map((entry) => (
                        <tr key={entry.id} className="border-b border-zinc-100">
                          <td className="py-2">{entry.reference}</td>
                          <td className="py-2">{entry.type}</td>
                          <td className="py-2">{entry.productName}</td>
                          <td className="py-2">{`${entry.warehouse} / ${entry.location}`}</td>
                          <td className="py-2">{entry.quantity}</td>
                          <td className="py-2">
                            <StatusBadge status={entry.status} />
                          </td>
                          <td className="py-2 text-xs text-zinc-500">{formatTimestamp(entry.timestamp)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            </div>
          )}

          {activeView === "Products" && (
            <div className="grid gap-4 xl:grid-cols-3">
              <SectionCard title="Create / Update Product">
                <div className="space-y-3">
                  <input
                    value={productForm.name}
                    onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={productForm.sku}
                    onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="SKU / Code"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={productForm.category}
                    onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Category"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <input
                    value={productForm.unit}
                    onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))}
                    placeholder="Unit of measure"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      value={productForm.reorderPoint}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, reorderPoint: Number(event.target.value) || 0 }))
                      }
                      type="number"
                      min={0}
                      placeholder="Reorder point"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <input
                      value={productForm.initialStock}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, initialStock: Number(event.target.value) || 0 }))
                      }
                      type="number"
                      min={0}
                      placeholder="Initial stock"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <select
                    value={productForm.warehouse}
                    onChange={(event) => {
                      const nextWarehouse = event.target.value;
                      const nextLocations = getWarehouseLocations(warehouses, nextWarehouse);
                      setProductForm((current) => ({
                        ...current,
                        warehouse: nextWarehouse,
                        location: nextLocations[0] ?? "General",
                      }));
                    }}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={productForm.location}
                    onChange={(event) => setProductForm((current) => ({ ...current, location: event.target.value }))}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {getWarehouseLocations(warehouses, productForm.warehouse).map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={upsertProduct}
                    className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                  >
                    {productForm.id ? "Update product" : "Create product"}
                  </button>
                </div>
              </SectionCard>

              <section className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-zinc-900">Catalog and Stock by Location</h2>
                  <input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search SKU / category / product"
                    className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="border-b border-zinc-200 text-zinc-500">
                      <tr>
                        <th className="py-2">Name</th>
                        <th className="py-2">SKU</th>
                        <th className="py-2">Category</th>
                        <th className="py-2">Stock Total</th>
                        <th className="py-2">Reorder Rule</th>
                        <th className="py-2">Locations</th>
                        <th className="py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleProducts.map((product) => {
                        const total = getTotalStock(product);
                        return (
                          <tr key={product.id} className="border-b border-zinc-100">
                            <td className="py-2">{product.name}</td>
                            <td className="py-2">{product.sku}</td>
                            <td className="py-2">{product.category}</td>
                            <td className="py-2">{total}</td>
                            <td className="py-2">Min {product.reorderPoint}</td>
                            <td className="py-2 text-xs text-zinc-500">
                              {Object.entries(product.stockByLocation)
                                .map(([key, qty]) => `${key.split("::").join(" / ")}: ${qty}`)
                                .join(" • ")}
                            </td>
                            <td className="py-2">
                              <button
                                type="button"
                                onClick={() => selectProductForEdit(product)}
                                className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          )}

          {(activeView === "Receipts" ||
            activeView === "Delivery" ||
            activeView === "Internal" ||
            activeView === "Adjustments") &&
            activeOperationType && (
              <div className="grid gap-4 xl:grid-cols-3">
                <SectionCard title={`${activeOperationType} Workflow`}>
                  <div className="space-y-3">
                    <select
                      value={operationForm.productId}
                      onChange={(event) => setOperationForm((current) => ({ ...current, productId: event.target.value }))}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {`${product.name} (${product.sku})`}
                        </option>
                      ))}
                    </select>

                    <select
                      value={operationForm.warehouse}
                      onChange={(event) => {
                        const nextWarehouse = event.target.value;
                        const locations = getWarehouseLocations(warehouses, nextWarehouse);
                        const firstLocation = locations[0] ?? "General";

                        setOperationForm((current) => ({
                          ...current,
                          warehouse: nextWarehouse,
                          location: firstLocation,
                          fromLocation: firstLocation,
                          toLocation: locations[1] ?? firstLocation,
                        }));
                      }}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                    >
                      {warehouses.map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.name}>
                          {warehouse.name}
                        </option>
                      ))}
                    </select>

                    {activeOperationType !== "Internal" && (
                      <select
                        value={operationForm.location}
                        onChange={(event) => setOperationForm((current) => ({ ...current, location: event.target.value }))}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                      >
                        {operationLocations.map((location) => (
                          <option key={location} value={location}>
                            {location}
                          </option>
                        ))}
                      </select>
                    )}

                    {activeOperationType === "Internal" && (
                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={operationForm.fromLocation}
                          onChange={(event) =>
                            setOperationForm((current) => ({ ...current, fromLocation: event.target.value }))
                          }
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                        >
                          {operationLocations.map((location) => (
                            <option key={location} value={location}>
                              {`From: ${location}`}
                            </option>
                          ))}
                        </select>
                        <select
                          value={operationForm.toLocation}
                          onChange={(event) =>
                            setOperationForm((current) => ({ ...current, toLocation: event.target.value }))
                          }
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                        >
                          {operationLocations.map((location) => (
                            <option key={location} value={location}>
                              {`To: ${location}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <input
                      type="number"
                      value={operationForm.quantity}
                      onChange={(event) =>
                        setOperationForm((current) => ({ ...current, quantity: Number(event.target.value) || 0 }))
                      }
                      placeholder={activeOperationType === "Adjustments" ? "Adjustment qty (+/-)" : "Quantity"}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={operationForm.notes}
                      onChange={(event) => setOperationForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder={
                        activeOperationType === "Receipts"
                          ? "Supplier details"
                          : activeOperationType === "Delivery"
                            ? "Shipment / customer details"
                            : "Operation notes"
                      }
                      className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={createOperation}
                      className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                    >
                      Create {activeOperationType}
                    </button>
                  </div>
                </SectionCard>

                <section className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-zinc-900">Pending and Completed {activeOperationType}</h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-sm">
                      <thead className="border-b border-zinc-200 text-zinc-500">
                        <tr>
                          <th className="py-2">Reference</th>
                          <th className="py-2">Product</th>
                          <th className="py-2">Location</th>
                          <th className="py-2">Qty</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Validate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ledger
                          .filter((entry) => entry.type === activeOperationType)
                          .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                          .map((entry) => (
                            <tr key={entry.id} className="border-b border-zinc-100">
                              <td className="py-2">{entry.reference}</td>
                              <td className="py-2">{entry.productName}</td>
                              <td className="py-2">
                                {entry.type === "Internal"
                                  ? `${entry.fromLocation} → ${entry.toLocation}`
                                  : `${entry.warehouse} / ${entry.location}`}
                              </td>
                              <td className="py-2">{entry.quantity}</td>
                              <td className="py-2">
                                <StatusBadge status={entry.status} />
                              </td>
                              <td className="py-2">
                                <button
                                  type="button"
                                  disabled={entry.status === "Done" || entry.status === "Canceled"}
                                  onClick={() => validateOperation(entry.id)}
                                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Validate
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            )}

          {activeView === "Move History" && (
            <SectionCard title="Stock Ledger">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-zinc-200 text-zinc-500">
                    <tr>
                      <th className="py-2">Timestamp</th>
                      <th className="py-2">Reference</th>
                      <th className="py-2">Type</th>
                      <th className="py-2">Product</th>
                      <th className="py-2">Warehouse</th>
                      <th className="py-2">Qty</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger
                      .slice()
                      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
                      .map((entry) => (
                        <tr key={entry.id} className="border-b border-zinc-100">
                          <td className="py-2 text-xs text-zinc-500">{formatTimestamp(entry.timestamp)}</td>
                          <td className="py-2">{entry.reference}</td>
                          <td className="py-2">{entry.type}</td>
                          <td className="py-2">{entry.productName}</td>
                          <td className="py-2">{entry.warehouse}</td>
                          <td className="py-2">{entry.quantity}</td>
                          <td className="py-2">
                            <StatusBadge status={entry.status} />
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}

          {activeView === "Setting" && (
            <div className="grid gap-4 md:grid-cols-2">
              <SectionCard title="Warehouse Management">
                <div className="space-y-3">
                  <input
                    value={warehouseNameInput}
                    onChange={(event) => setWarehouseNameInput(event.target.value)}
                    placeholder="New warehouse name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addWarehouse}
                    className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
                  >
                    Add warehouse
                  </button>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-zinc-700">
                  {warehouses.map((warehouse) => (
                    <li key={warehouse.id} className="rounded-md border border-zinc-200 px-3 py-2">
                      <p className="font-medium">{warehouse.name}</p>
                      <p className="text-xs text-zinc-500">{warehouse.locations.length} locations configured</p>
                    </li>
                  ))}
                </ul>
              </SectionCard>

              <SectionCard title="Location Setup">
                <div className="space-y-3">
                  <select
                    value={locationWarehouseInput}
                    onChange={(event) => setLocationWarehouseInput(event.target.value)}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm"
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.name}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                  <input
                    value={locationNameInput}
                    onChange={(event) => setLocationNameInput(event.target.value)}
                    placeholder="Location name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addLocation}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700"
                  >
                    Add location
                  </button>
                </div>

                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                  Multi-warehouse configuration is active. Use this section to define operational locations for receipts,
                  picking, and transfers.
                </div>
              </SectionCard>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
