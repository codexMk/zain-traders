export type AppRole = "OWNER" | "STAFF" | "ACCOUNTANT";

export const permissions = {
  canEditProducts: (role: AppRole) => role === "OWNER",
  canManageStock: (role: AppRole) => role === "OWNER",
  canViewProfitReports: (role: AppRole) => role === "OWNER" || role === "ACCOUNTANT",
  canDeleteInvoices: (role: AppRole) => role === "OWNER",
  canCreateInvoices: (role: AppRole) => role === "OWNER" || role === "STAFF",
  canViewCustomers: (role: AppRole) => !!role,
  canViewProducts: (role: AppRole) => !!role,
  canManageExpenses: (role: AppRole) => role === "OWNER" || role === "ACCOUNTANT",
} as const;
