import InventoryManager from "@/components/inventory/inventory-manager";

export const metadata = {
  title: "Inventory - Zain Traders",
};

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-brand-charcoal">Inventory Management</h1>
        <p className="text-brand-muted mt-1">Stock in, stock out, damaged stock & alerts</p>
      </div>
      <InventoryManager />
    </div>
  );
}
