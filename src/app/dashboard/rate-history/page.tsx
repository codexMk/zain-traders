"use client";

import { TrendingUp } from "lucide-react";

export default function RateHistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Rate History</h1>
        <p className="text-gray-600 mt-1">Track market rate trends across locations</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Rate history tracking module coming soon...</p>
      </div>
    </div>
  );
}
