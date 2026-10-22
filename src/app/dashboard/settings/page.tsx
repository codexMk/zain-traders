"use client";

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">System configuration and user management</p>
      </div>

      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">Settings module coming soon...</p>
      </div>
    </div>
  );
}
