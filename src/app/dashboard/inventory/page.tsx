"use client";

import { Package } from "lucide-react";

export default function InventoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
        <p className="text-gray-600 mt-1">Stock tracking and management</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Inventory management module coming soon...</p>
      </div>
    </div>
  );
}
