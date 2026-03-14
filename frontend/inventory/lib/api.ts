/**
 * API Configuration and Utility Functions
 */

import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

/* ================= AXIOS INSTANCE ================= */

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/* ================= TOKEN ================= */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function removeUser() {
  localStorage.removeItem("user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any) {
  localStorage.setItem("user", JSON.stringify(user));
}

/* ================= AUTH ================= */

export async function signup(
  name: string,
  email: string,
  password: string,
  confirmPassword: string
) {
  const response = await api.post("/auth/signup", {
    name,
    email,
    password,
    confirmPassword,
  });

  if (response.data?.token) {
    setToken(response.data.token);
    setUser(response.data.user);
  }

  return response.data;
}

export async function login(email: string, password: string) {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  if (response.data?.token) {
    setToken(response.data.token);
    setUser(response.data.user);
  }

  return response.data;
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    clearToken();
    removeUser();
  }
}

/* ================= PRODUCTS ================= */

export async function getProducts(
  page = 1,
  limit = 50,
  search = "",
  categoryId = ""
) {
  const params = {
    page,
    limit,
    ...(search && { search }),
    ...(categoryId && { categoryId }),
  };

  const response = await api.get("/products", { params });

  return {
    data: response.data?.products || [],
    total: response.data?.total || 0,
  };
}

export async function createProduct(data: any) {
  const response = await api.post("/products", data);
  return response.data;
}

export async function updateProduct(productId: string, data: any) {
  const response = await api.put(`/products/${productId}`, data);
  return response.data;
}

export async function getProductStock(productId: string) {
  const response = await api.get(`/products/${productId}/stock`);

  return {
    stockByLocation: response.data?.stockByLocation || {},
    totalStock: response.data?.totalStock || 0,
  };
}

/* ================= WAREHOUSES ================= */

export async function getWarehouses() {
  const response = await api.get("/warehouses");

  return response.data?.warehouses || [];
}

/* ================= RECEIPTS ================= */

export async function getReceipts(
  status = "",
  warehouseId = "",
  page = 1,
  limit = 50
) {
  const params = {
    page,
    limit,
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
  };

  const response = await api.get("/receipts", { params });

  return response.data?.receipts || [];
}

export async function createReceipt(data: any) {
  const response = await api.post("/receipts", data);
  return response.data;
}

export async function validateReceipt(receiptId: string) {
  const response = await api.put(`/receipts/${receiptId}/validate`);
  return response.data;
}

/* ================= DELIVERIES ================= */

export async function getDeliveries(
  status = "",
  warehouseId = "",
  page = 1,
  limit = 50
) {
  const params = {
    page,
    limit,
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
  };

  const response = await api.get("/deliveries", { params });

  return response.data?.deliveries || [];
}

export async function createDelivery(data: any) {
  const response = await api.post("/deliveries", data);
  return response.data;
}

export async function validateDelivery(deliveryId: string) {
  const response = await api.put(`/deliveries/${deliveryId}/validate`);
  return response.data;
}

/* ================= TRANSFERS ================= */

export async function getTransfers(page = 1, limit = 50) {
  const response = await api.get("/transfers", {
    params: { page, limit },
  });

  return response.data?.transfers || [];
}

export async function createTransfer(data: any) {
  const response = await api.post("/transfers", data);
  return response.data;
}

export async function validateTransfer(transferId: string) {
  const response = await api.put(`/transfers/${transferId}/validate`);
  return response.data;
}

/* ================= ADJUSTMENTS ================= */

export async function getAdjustments(page = 1, limit = 50) {
  const response = await api.get("/adjustments", {
    params: { page, limit },
  });

  return response.data?.adjustments || [];
}

export async function createAdjustment(data: any) {
  const response = await api.post("/adjustments", data);
  return response.data;
}

export async function validateAdjustment(adjustmentId: string) {
  const response = await api.put(`/adjustments/${adjustmentId}/validate`);
  return response.data;
}

/* ================= STOCK MOVES ================= */

export async function getStockMoves(
  type = "",
  productId = "",
  fromLocationId = "",
  toLocationId = "",
  refType = "",
  page = 1,
  limit = 50
) {
  const params = {
    page,
    limit,
    ...(type && { type }),
    ...(productId && { productId }),
    ...(fromLocationId && { fromLocationId }),
    ...(toLocationId && { toLocationId }),
    ...(refType && { refType }),
  };

  const response = await api.get("/stock/moves", { params });

  return response.data?.moves || [];
}

/* ================= DASHBOARD ================= */

export async function getDashboardKPIs(warehouseId = "") {
  const response = await api.get("/dashboard/kpis", {
    params: warehouseId ? { warehouseId } : {},
  });

  return response.data;
}

/* ================= WRAPPER FUNCTIONS ================= */

export async function createSingleProductReceipt(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  location: string;
  notes: string;
}) {
  return await createReceipt({
    warehouseId: data.warehouse,
    lines: [
      {
        productId: data.productId,
        locationId: data.location,
        expectedQty: data.quantity,
      },
    ],
    notes: data.notes,
  });
}

export async function createSingleProductDelivery(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  location: string;
  notes: string;
}) {
  return await createDelivery({
    warehouseId: data.warehouse,
    lines: [
      {
        productId: data.productId,
        locationId: data.location,
        requestedQty: data.quantity,
      },
    ],
    notes: data.notes,
  });
}

export async function createSingleProductTransfer(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  fromLocation: string;
  toLocation: string;
  notes: string;
}) {
  return await createTransfer({
    fromLocationId: data.fromLocation,
    toLocationId: data.toLocation,
    lines: [
      {
        productId: data.productId,
        qty: data.quantity,
      },
    ],
    notes: data.notes,
  });
}