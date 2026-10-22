"use client";

import { BarChart3 } from "lucide-react";

export default function AccountingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Accounting</h1>
        <p className="text-gray-600 mt-1">Financial tracking and reports</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Accounting module coming soon...</p>
      </div>
    </div>
  );
}
