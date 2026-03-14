/**
 * API Configuration and Utility Functions
 * Handles all communication with the backend server using Axios
 */

import axios, { AxiosInstance, AxiosError } from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error: any) => {
    // Enhanced error logging for debugging
    const errorDetails = {
      isAxiosError: axios.isAxiosError(error),
      message: error?.message,
      code: error?.code,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      url: error?.config?.url,
      method: error?.config?.method,
      requestData: error?.config?.data,
      responseData: error?.response?.data,
      errorType: error?.constructor?.name,
    };
    
    console.error("❌ API Error Details:", errorDetails);
    console.error("   Full Error:", error);
    
    // Extract meaningful error message
    let message = "API Error";
    
    if (error?.response?.data?.error) {
      message = error.response.data.error;
    } else if (error?.response?.data?.message) {
      message = error.response.data.message;
    } else if (error?.message) {
      message = error.message;
    }
    
    // Add status code to message if available
    if (error?.response?.status) {
      message = `[${error.response.status} ${error?.response?.statusText || "Error"}] ${message}`;
    }
    
    console.error("   Final Error Message:", message);
    throw new Error(message);
  }
);

// ========== TOKEN MANAGEMENT ==========

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function clearToken(): void {
  localStorage.removeItem("token");
}

export function removeUser(): void {
  localStorage.removeItem("user");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function setUser(user: any): void {
  localStorage.setItem("user", JSON.stringify(user));
}

// ========== AUTHENTICATION ==========

export async function signup(name: string, email: string, password: string, confirmPassword: string) {
  console.log("📝 Signup attempt started");
  console.log("   API URL:", API_BASE_URL);
  console.log("   Endpoint: /auth/signup");
  console.log("   Payload:", { name, email, passwordLength: password.length });
  
  try {
    console.log("🔄 Sending POST request...");
    const response = (await axiosInstance.post<any>("/auth/signup", {
      name,
      email,
      password,
      confirmPassword,
    })) as any;

    console.log("✅ Signup successful");
    console.log("   Token received:", !!response?.token);
    console.log("   User:", response?.user?.email);

    if (response?.token) {
      setToken(response.token);
      setUser(response.user);
    }

    return response;
  } catch (error) {
    console.error("❌ Signup failed:");
    console.error("   Error object:", error);
    console.error("   Error message:", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export async function login(email: string, password: string) {
  console.log("🔐 Login attempt started");
  console.log("   API URL:", API_BASE_URL);
  console.log("   Endpoint: /auth/login");
  console.log("   Email:", email);
  
  try {
    console.log("🔄 Sending POST request...");
    const response = (await axiosInstance.post<any>("/auth/login", { email, password })) as any;

    console.log("✅ Login successful");
    console.log("   Token received:", !!response?.token);
    console.log("   User:", response?.user?.email);

    if (response?.token) {
      setToken(response.token);
      setUser(response.user);
    }

    return response;
  } catch (error) {
    console.error("❌ Login failed:");
    console.error("   Error object:", error);
    throw error;
  }
}

export async function logout() {
  try {
    await axiosInstance.post("/auth/logout");
  } finally {
    clearToken();
    removeUser();
  }
}

export async function getCurrentUser() {
  return axiosInstance.get("/auth/me");
}

export async function forgotPassword(email: string) {
  return axiosInstance.post("/auth/forgot-password", { email });
}

export async function verifyOtpWithEmail(email: string, otp: string) {
  return axiosInstance.post("/auth/verify-otp", { email, otp });
}

export async function resetPasswordWithEmail(email: string, otp: string, newPassword: string) {
  return axiosInstance.post("/auth/reset-password", {
    email,
    otp,
    newPassword,
    confirmPassword: newPassword,
  });
}

// ========== PRODUCTS ==========

export async function getProducts(page = 1, limit = 50, search = "", categoryId = "") {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(categoryId && { categoryId }),
  });

  return axiosInstance.get(`/products?${params}`);
}

export async function createProduct(data: {
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasure?: string;
  lowStockQty?: number;
  imageUrl?: string;
}) {
  return axiosInstance.post("/products", data);
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string;
    sku?: string;
    category?: string;
    unit?: string;
    reorderPoint?: number;
  }
) {
  const updateData: any = {};
  if (data.name) updateData.name = data.name;
  if (data.sku) updateData.sku = data.sku;
  if (data.unit) updateData.unitOfMeasure = data.unit;
  if (data.reorderPoint) updateData.lowStockQty = data.reorderPoint;

  return axiosInstance.put(`/products/${productId}`, updateData);
}

export async function getProductStock(productId: string) {
  return axiosInstance.get(`/products/${productId}/stock`);
}

// ========== RECEIPTS ==========

export async function getReceipts(status = "", warehouseId = "", page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
  });

  return axiosInstance.get(`/receipts?${params}`);
}

export async function createReceipt(data: {
  supplierId?: string;
  warehouseId: string;
  scheduledDate?: string;
  lines: Array<{
    productId: string;
    locationId: string;
    expectedQty: number;
  }>;
}) {
  return axiosInstance.post("/receipts", data);
}

export async function validateReceipt(receiptId: string) {
  return axiosInstance.put(`/receipts/${receiptId}/validate`);
}

// ========== DELIVERIES ==========

export async function getDeliveries(status = "", warehouseId = "", page = 1, limit = 50) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(status && { status }),
    ...(warehouseId && { warehouseId }),
  });

  return axiosInstance.get(`/deliveries?${params}`);
}

export async function createDelivery(data: {
  customerId?: string;
  warehouseId: string;
  scheduledDate?: string;
  lines: Array<{
    productId: string;
    locationId: string;
    requestedQty: number;
  }>;
}) {
  return axiosInstance.post("/deliveries", data);
}

export async function validateDelivery(deliveryId: string) {
  return axiosInstance.put(`/deliveries/${deliveryId}/validate`);
}

// ========== TRANSFERS ==========

export async function createTransfer(data: {
  fromLocationId: string;
  toLocationId: string;
  lines: Array<{
    productId: string;
    qty: number;
  }>;
}) {
  return axiosInstance.post("/transfers", data);
}

export async function validateTransfer(transferId: string) {
  return axiosInstance.put(`/transfers/${transferId}/validate`);
}

export async function getTransfers(page = 1, limit = 50) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return axiosInstance.get(`/transfers?${params}`);
  } catch {
    return { transfers: [] };
  }
}

// ========== ADJUSTMENTS ==========

export async function createAdjustment(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  location: string;
  notes?: string;
}) {
  return axiosInstance.post("/adjustments", {
    warehouseId: data.warehouse,
    lines: [
      {
        productId: data.productId,
        locationId: data.location,
        quantity: data.quantity,
      },
    ],
  });
}

export async function validateAdjustment(adjustmentId: string) {
  return axiosInstance.put(`/adjustments/${adjustmentId}/validate`);
}

export async function getAdjustments(page = 1, limit = 50) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    return axiosInstance.get(`/adjustments?${params}`);
  } catch {
    return { adjustments: [] };
  }
}

// ========== STOCK MOVES ==========

export async function getStockMoves(
  type = "",
  productId = "",
  fromLocationId = "",
  toLocationId = "",
  refType = "",
  page = 1,
  limit = 50
) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(type && { type }),
    ...(productId && { productId }),
    ...(fromLocationId && { fromLocationId }),
    ...(toLocationId && { toLocationId }),
    ...(refType && { refType }),
  });

  return axiosInstance.get(`/stock/moves?${params}`);
}

// ========== DASHBOARD ==========

export async function getDashboardKPIs(warehouseId = "") {
  const params = new URLSearchParams({
    ...(warehouseId && { warehouseId }),
  });

  return axiosInstance.get(`/dashboard/kpis?${params}`);
}

// ========== WRAPPER FUNCTIONS FOR UI SIMPLICITY ==========

export async function createSingleProductReceipt(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  location: string;
  notes?: string;
}) {
  return createReceipt({
    warehouseId: data.warehouse,
    lines: [
      {
        productId: data.productId,
        locationId: data.location,
        expectedQty: data.quantity,
      },
    ],
  });
}

export async function createSingleProductDelivery(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  location: string;
  notes?: string;
}) {
  return createDelivery({
    warehouseId: data.warehouse,
    lines: [
      {
        productId: data.productId,
        locationId: data.location,
        requestedQty: data.quantity,
      },
    ],
  });
}

export async function createSingleProductTransfer(data: {
  productId: string;
  quantity: number;
  warehouse: string;
  fromLocation: string;
  toLocation: string;
  notes?: string;
}) {
  return createTransfer({
    fromLocationId: `${data.warehouse}::${data.fromLocation}`,
    toLocationId: `${data.warehouse}::${data.toLocation}`,
    lines: [
      {
        productId: data.productId,
        qty: data.quantity,
      },
    ],
  });
}
