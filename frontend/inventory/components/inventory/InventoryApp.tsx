"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar, type NavigationKey } from "@/components/inventory/Sidebar";
import {
  applyValidatedLedgerEntry,
  buildKpis,
  getCategories,
  getLocationKey,
  getTotalStock,
  matchesFilters,
} from "@/lib/inventory";
import { isNonNegativeNumber, isPositiveNumber, isValidLabel, isValidSku, sanitizeText } from "@/lib/validators";
import * as api from "@/lib/api";
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

function normalizeStatus(status: string): LedgerEntry["status"] {
  const map: Record<string, LedgerEntry["status"]> = {
    DRAFT: "Draft",
    WAITING: "Waiting",
    READY: "Ready",
    DONE: "Done",
    CANCELED: "Canceled",
    Draft: "Draft",
    Waiting: "Waiting",
    Ready: "Ready",
    Done: "Done",
    Canceled: "Canceled",
  };
  return map[status] ?? "Draft";
}

export function InventoryApp() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileName, setProfileName] = useState("Inventory Manager");
  const [activeView, setActiveView] = useState<NavigationKey>("Dashboard");

  // API data states
  const [products, setProducts] = useState<Product[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState<string>("");

  // UI states
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [productSearch, setProductSearch] = useState("");
  const [productForm, setProductForm] = useState<ProductFormState>(DEFAULT_PRODUCT_FORM);
  const [operationForm, setOperationForm] = useState<OperationFormState>(DEFAULT_OPERATION_FORM);

  const [warehouseNameInput, setWarehouseNameInput] = useState("");
  const [locationWarehouseInput, setLocationWarehouseInput] = useState("Main Warehouse");
  const [locationNameInput, setLocationNameInput] = useState("");
  const [bannerMessage, setBannerMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auth check: redirect to /login if no token
  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      const user = api.getUser() as any;
      if (user?.name) setProfileName(user.name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Load data from API
  useEffect(() => {
    const loadData = async () => {
      if (!isAuthenticated) return;

      setIsLoadingData(true);
      setDataError("");

      try {
        // Fetch products and stock information
        // api.getProducts now returns { data: Product[], total: number } directly
        const productsResponse = (await api.getProducts(1, 1000)) as any;
        const products = productsResponse.data || [];
        
        const productsWithStock = await Promise.all(
          products.map(async (product: Product) => {
            try {
              const stockResponse = (await api.getProductStock(product.id)) as any;
              return {
                ...product,
                stockByLocation: stockResponse.data?.stockByLocation || {},
              };
            } catch {
              // If stock fetch fails, just return product without stock
              return {
                ...product,
                stockByLocation: {},
              };
            }
          }),
        );
        setProducts(productsWithStock);

        // Fetch ledger entries (receipts + deliveries + transfers + adjustments)
        // api.getXxx() functions now return arrays directly (already unwrapped)
        const [receiptsRaw, deliveriesRaw, transfersRaw, adjustmentsRaw] = await Promise.all([
          api.getReceipts("", ""),
          api.getDeliveries("", ""),
          api.getTransfers(1, 1000),
          api.getAdjustments(1, 1000),
        ]);

        const receiptsData = (receiptsRaw as any[]) || [];
        const deliveriesData = (deliveriesRaw as any[]) || [];
        const transfersData = (transfersRaw as any[]) || [];
        const adjustmentsData = (adjustmentsRaw as any[]) || [];

        // Combine all ledger entries and convert to LedgerEntry format
        // Receipts/Deliveries have nested lines[] — flatMap to produce one entry per line
        const allEntries: LedgerEntry[] = [
          ...receiptsData.flatMap((r: any) =>
            (r.lines && r.lines.length > 0 ? r.lines : [null]).map((line: any) => ({
              id: line ? `${r.id}-${line.id}` : r.id,
              type: "Receipts" as OperationType,
              status: normalizeStatus(r.status),
              reference: r.referenceNumber || `RCPT-${r.id.slice(0, 8)}`,
              productId: line?.productId ?? r.productId ?? "",
              productName: line?.product?.name ?? r.productName ?? "Unknown",
              category: line?.product?.category?.name ?? r.category ?? "Uncategorized",
              warehouse: r.warehouse?.name ?? r.warehouseName ?? "Main Warehouse",
              location: line?.location?.name ?? r.location ?? "General",
              quantity: parseFloat(line?.receivedQty ?? line?.expectedQty ?? r.quantity ?? 0),
              timestamp: r.createdAt,
              notes: r.notes ?? "",
            }))
          ),
          ...deliveriesData.flatMap((d: any) =>
            (d.lines && d.lines.length > 0 ? d.lines : [null]).map((line: any) => ({
              id: line ? `${d.id}-${line.id}` : d.id,
              type: "Delivery" as OperationType,
              status: normalizeStatus(d.status),
              reference: d.referenceNumber || `DLV-${d.id.slice(0, 8)}`,
              productId: line?.productId ?? d.productId ?? "",
              productName: line?.product?.name ?? d.productName ?? "Unknown",
              category: line?.product?.category?.name ?? d.category ?? "Uncategorized",
              warehouse: d.warehouse?.name ?? d.warehouseName ?? "Main Warehouse",
              location: line?.location?.name ?? d.location ?? "General",
              quantity: parseFloat(line?.shippedQty ?? line?.requestedQty ?? d.quantity ?? 0),
              timestamp: d.createdAt,
              notes: d.notes ?? "",
            }))
          ),
          ...transfersData.flatMap((t: any) =>
            (t.lines && t.lines.length > 0 ? t.lines : [null]).map((line: any) => ({
              id: line ? `${t.id}-${line.id}` : t.id,
              type: "Internal" as OperationType,
              status: normalizeStatus(t.status),
              reference: t.referenceNumber || `INT-${t.id.slice(0, 8)}`,
              productId: line?.productId ?? t.productId ?? "",
              productName: line?.product?.name ?? t.productName ?? "Unknown",
              category: line?.product?.category?.name ?? t.category ?? "Uncategorized",
              warehouse: t.fromLocation?.warehouse?.name ?? "Main Warehouse",
              location: t.toLocation?.name ?? t.toLocationId ?? "General",
              fromLocation: t.fromLocation?.name ?? t.fromLocationId,
              toLocation: t.toLocation?.name ?? t.toLocationId,
              quantity: parseFloat(line?.transferQty ?? line?.qty ?? t.quantity ?? 0),
              timestamp: t.createdAt,
              notes: t.notes ?? "",
            }))
          ),
          ...adjustmentsData.flatMap((a: any) =>
            (a.lines && a.lines.length > 0 ? a.lines : [null]).map((line: any) => ({
              id: line ? `${a.id}-${line.id}` : a.id,
              type: "Adjustments" as OperationType,
              status: normalizeStatus(a.status),
              reference: a.referenceNumber || `ADJ-${a.id.slice(0, 8)}`,
              productId: line?.productId ?? a.productId ?? "",
              productName: line?.product?.name ?? a.productName ?? "Unknown",
              category: line?.product?.category?.name ?? a.category ?? "Uncategorized",
              warehouse: line?.location?.warehouse?.name ?? a.warehouse ?? "Main Warehouse",
              location: line?.location?.name ?? a.location ?? "General",
              quantity: parseFloat(line?.adjustedQty ?? a.quantity ?? 0),
              timestamp: a.createdAt,
              notes: a.reason ?? a.notes ?? "",
            }))
          ),
        ];

        setLedger(allEntries);

        // Load warehouses from API; fall back to defaults if unavailable
        try {
          const warehousesRaw = (await api.getWarehouses()) as any[];
          if (warehousesRaw.length > 0) {
            setWarehouses(
              warehousesRaw.map((w: any) => ({
                id: w.id,
                name: w.name,
                locations: (w.locations || []).map((l: any) => l.name ?? l),
              }))
            );
          } else {
            setWarehouses([{ id: "w-1", name: "Main Warehouse", locations: ["General", "Rack A", "Rack B", "Storage"] }]);
          }
        } catch {
          setWarehouses([{ id: "w-1", name: "Main Warehouse", locations: ["General", "Rack A", "Rack B", "Storage"] }]);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load inventory data";
        setDataError(message);
        setBannerMessage(`Error loading data: ${message}`);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [isAuthenticated]);

  const authenticate = (name: string) => {
    setProfileName(name);
    setIsAuthenticated(true);
    setActiveView("Dashboard");
    setBannerMessage("Authentication successful. Redirected to Inventory Dashboard.");
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      api.clearToken();
      api.removeUser();
      setIsAuthenticated(false);
      setBannerMessage("You have been logged out.");
      setProducts([]);
      setLedger([]);
      setActiveView("Dashboard");
      // Redirect to login page
      setTimeout(() => router.push("/login"), 500);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Logout failed";
      setBannerMessage(`Logout error: ${message}`);
      // Still redirect even if logout fails
      setTimeout(() => router.push("/login"), 1000);
    }
  };

  const upsertProduct = async () => {
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

    setIsSubmitting(true);
    try {
      if (productForm.id) {
        // Update existing product via API
        await api.updateProduct(productForm.id, {
          name: normalizedName,
          sku: normalizedSku,
          category: normalizedCategory,
          unit: normalizedUnit,
          reorderPoint: productForm.reorderPoint,
        });

        // Update local state
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
                }
              : product,
          ),
        );
        setBannerMessage(`Product ${normalizedName} updated.`);
      } else {
        // Create new product via API
        const response = (await api.createProduct({
          name: normalizedName,
          sku: normalizedSku,
          categoryId: normalizedCategory,
          unitOfMeasure: normalizedUnit,
          lowStockQty: productForm.reorderPoint,
        })) as any;

        const newProduct = response.data || response;

        // Add to local state
        setProducts((current) => [
          {
            id: newProduct.id,
            name: normalizedName,
            sku: normalizedSku,
            category: normalizedCategory,
            unit: normalizedUnit,
            reorderPoint: productForm.reorderPoint,
            stockByLocation: {},
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      setBannerMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
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

  const createOperation = async () => {
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

    setIsSubmitting(true);
    try {
      let newEntry: any;

      if (activeOperationType === "Receipts") {
        newEntry = await api.createSingleProductReceipt({
          productId: selectedProduct.id,
          quantity: operationForm.quantity,
          warehouse: operationForm.warehouse,
          location: operationForm.location,
          notes: sanitizeText(operationForm.notes),
        });
        newEntry.type = "Receipts";
      } else if (activeOperationType === "Delivery") {
        newEntry = await api.createSingleProductDelivery({
          productId: selectedProduct.id,
          quantity: operationForm.quantity,
          warehouse: operationForm.warehouse,
          location: operationForm.location,
          notes: sanitizeText(operationForm.notes),
        });
        newEntry.type = "Delivery";
      } else if (activeOperationType === "Internal") {
        newEntry = await api.createSingleProductTransfer({
          productId: selectedProduct.id,
          quantity: operationForm.quantity,
          warehouse: operationForm.warehouse,
          fromLocation: operationForm.fromLocation,
          toLocation: operationForm.toLocation,
          notes: sanitizeText(operationForm.notes),
        });
        newEntry.type = "Internal";
      } else if (activeOperationType === "Adjustments") {
        newEntry = await api.createAdjustment({
          productId: selectedProduct.id,
          quantity: operationForm.quantity,
          warehouse: operationForm.warehouse,
          location: operationForm.location,
          notes: sanitizeText(operationForm.notes),
        });
        newEntry.type = "Adjustments";
      }

      // Add to ledger
      const entry: LedgerEntry = {
        id: newEntry.id,
        type: newEntry.type,
        status: normalizeStatus(newEntry.status || "DRAFT"),
        reference: newEntry.referenceNumber || `${newEntry.type}-${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        category: selectedProduct.category,
        warehouse: operationForm.warehouse,
        location: activeOperationType === "Internal" ? operationForm.toLocation : operationForm.location,
        quantity: operationForm.quantity,
        timestamp: newEntry.createdAt || new Date().toISOString(),
        notes: sanitizeText(operationForm.notes),
        fromLocation: activeOperationType === "Internal" ? operationForm.fromLocation : undefined,
        toLocation: activeOperationType === "Internal" ? operationForm.toLocation : undefined,
      };

      setLedger((current) => [entry, ...current]);
      setBannerMessage(`${activeOperationType} ${entry.reference} created successfully.`);
      setOperationForm((current) => ({
        ...current,
        notes: "",
        quantity: activeOperationType === "Adjustments" ? -1 : 1,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create operation";
      setBannerMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateOperation = async (entryId: string) => {
    const target = ledger.find((entry) => entry.id === entryId);

    if (!target || target.status === "Done" || target.status === "Canceled") {
      return;
    }

    setIsSubmitting(true);
    try {
      let validationResult: any;

      if (target.type === "Receipts") {
        validationResult = await api.validateReceipt(entryId);
      } else if (target.type === "Delivery") {
        validationResult = await api.validateDelivery(entryId);
      } else if (target.type === "Internal") {
        validationResult = await api.validateTransfer(entryId);
      } else if (target.type === "Adjustments") {
        validationResult = await api.validateAdjustment(entryId);
      }

      // Update ledger entry status
      setLedger((current) =>
        current.map((entry) =>
          entry.id === entryId ? { ...entry, status: "Done" } : entry,
        ),
      );

      setBannerMessage(`Operation ${target.reference} validated successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to validate operation";
      setBannerMessage(`Error validating operation: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addWarehouse = async () => {
    const name = sanitizeText(warehouseNameInput);
    if (!isValidLabel(name) || warehouses.some((warehouse) => warehouse.name.toLowerCase() === name.toLowerCase())) {
      setBannerMessage("Warehouse name is invalid or already exists.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API endpoint to create warehouse when available
      // const result = await api.createWarehouse({ name });
      setWarehouses((current) => [...current, { id: `w-${Date.now()}`, name, locations: ["General"] }]);
      setWarehouseNameInput("");
      setBannerMessage(`Warehouse ${name} added.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add warehouse";
      setBannerMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLocation = async () => {
    const location = sanitizeText(locationNameInput);

    if (!isValidLabel(location)) {
      setBannerMessage("Location name is invalid.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Call API endpoint to add location when available
      // const result = await api.addLocationToWarehouse(locationWarehouseInput, { name: location });
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
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to add location";
      setBannerMessage(`Error: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-360">
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

          {isLoadingData && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              Loading inventory data...
            </div>
          )}

          {dataError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              Error: {dataError}
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
                    onChange={(event) => setFilters((current: DashboardFilters) => ({ ...current, type: event.target.value as DashboardFilters["type"] }))}
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
                    onChange={(event) => setFilters((current: DashboardFilters) => ({ ...current, status: event.target.value as DashboardFilters["status"] }))}
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
                    onChange={(event) => setFilters((current: DashboardFilters) => ({ ...current, warehouse: event.target.value }))}
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
                    onChange={(event) => setFilters((current: DashboardFilters) => ({ ...current, category: event.target.value }))}
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
                  <table className="w-full min-w-175 text-left text-sm">
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <input
                    value={productForm.sku}
                    onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
                    placeholder="SKU / Code"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <input
                    value={productForm.category}
                    onChange={(event) => setProductForm((current) => ({ ...current, category: event.target.value }))}
                    placeholder="Category"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <input
                    value={productForm.unit}
                    onChange={(event) => setProductForm((current) => ({ ...current, unit: event.target.value }))}
                    placeholder="Unit of measure"
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
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
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                    />
                    <input
                      value={productForm.initialStock}
                      onChange={(event) =>
                        setProductForm((current) => ({ ...current, initialStock: Number(event.target.value) || 0 }))
                      }
                      type="number"
                      min={0}
                      placeholder="Initial stock"
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isSubmitting ? "Saving..." : productForm.id ? "Update product" : "Create product"}
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
                  <table className="w-full min-w-190 text-left text-sm">
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
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                        disabled={isSubmitting}
                        className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                          disabled={isSubmitting}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                          disabled={isSubmitting}
                          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                      disabled={isSubmitting}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
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
                      disabled={isSubmitting}
                      className="min-h-24 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={createOperation}
                      disabled={isSubmitting}
                      className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      {isSubmitting ? "Creating..." : `Create ${activeOperationType}`}
                    </button>
                  </div>
                </SectionCard>

                <section className="xl:col-span-2 rounded-xl border border-zinc-200 bg-white p-4">
                  <h2 className="text-sm font-semibold text-zinc-900">Pending and Completed {activeOperationType}</h2>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-190 text-left text-sm">
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
                                  disabled={entry.status === "Done" || entry.status === "Canceled" || isSubmitting}
                                  onClick={() => validateOperation(entry.id)}
                                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 transition-opacity"
                                >
                                  {isSubmitting ? "Processing..." : "Validate"}
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
                <table className="w-full min-w-190 text-left text-sm">
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={addWarehouse}
                    disabled={isSubmitting}
                    className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  >
                    {isSubmitting ? "Processing..." : "Add warehouse"}
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
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
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={addLocation}
                    disabled={isSubmitting}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-zinc-50"
                  >
                    {isSubmitting ? "Processing..." : "Add location"}
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
