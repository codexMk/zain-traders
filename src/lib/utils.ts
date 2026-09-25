import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
}

/**
 * Format date in Indian locale
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Format time only
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateObj);
}

/**
 * Calculate GST amount
 */
export function calculateGST(amount: number, gstPercent: number): number {
  return (amount * gstPercent) / 100;
}

/**
 * Calculate total with GST
 */
export function calculateTotal(amount: number, gstPercent: number): number {
  const gst = calculateGST(amount, gstPercent);
  return amount + gst;
}

/**
 * Round to 2 decimal places
 */
export function roundTo2(num: number): number {
  return Math.round(num * 100) / 100;
}

/**
 * Format number with Indian currency comma separation
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Validate email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (10 digits for India)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ""));
}

/**
 * Validate GST number (15 characters)
 */
export function isValidGST(gst: string): boolean {
  return /^[0-9A-Z]{15}$/.test(gst);
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV${timestamp}${random}`;
}

/**
 * Generate purchase order number
 */
export function generatePurchaseNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `PO${timestamp}${random}`;
}

/**
 * Get page title for breadcrumbs
 */
export function getTitleFromPath(path: string): string {
  const segments = path.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Calculate outstanding amount
 */
export function calculateOutstanding(
  totalAmount: number,
  paidAmount: number
): number {
  return roundTo2(totalAmount - paidAmount);
}

/**
 * Get status color
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    PAID: "bg-green-100 text-green-800",
    PARTIALLY_PAID: "bg-yellow-100 text-yellow-800",
    OVERDUE: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

/**
 * Get stock status
 */
export function getStockStatus(
  currentStock: number,
  minimumStock: number
): {
  status: "ok" | "low" | "empty";
  label: string;
} {
  if (currentStock === 0) {
    return { status: "empty", label: "Out of Stock" };
  }
  if (currentStock <= minimumStock) {
    return { status: "low", label: "Low Stock" };
  }
  return { status: "ok", label: "In Stock" };
}

/**
 * Delay function for async operations
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate margin percentage
 */
export function calculateMargin(
  sellingPrice: number,
  costPrice: number
): number {
  return roundTo2(((sellingPrice - costPrice) / sellingPrice) * 100);
}

/**
 * Convert unit to standard unit (KG)
 */
export function convertToKG(
  quantity: number,
  unit: string
): {
  quantity: number;
  unit: string;
} {
  const conversions: Record<string, number> = {
    KG: 1,
    GRAM: 0.001,
    BAG: 25, // Assuming 1 bag = 25 KG
    PIECE: 0.5, // Assuming 1 piece = 0.5 KG (approximate)
  };

  const kgQuantity = quantity * (conversions[unit] || 1);
  return {
    quantity: roundTo2(kgQuantity),
    unit: "KG",
  };
}

