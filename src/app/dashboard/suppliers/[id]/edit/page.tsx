"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SupplierForm from "@/components/forms/supplier-form";

export default function EditSupplierPage() {
  const params = useParams();
  const id = params.id as string;
  const [supplier, setSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(`/api/suppliers/${id}`);
        if (!response.ok) {
          setError("Supplier not found");
          return;
        }
        const data = await response.json();
        setSupplier(data);
      } catch {
        setError("Failed to load supplier");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-r-emerald-600"></div>
          <p className="mt-4 text-gray-600">Loading supplier...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">{error}</div>
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">Supplier not found</div>
      </div>
    );
  }

  return <SupplierForm initialData={supplier} isEditing={true} />;
}
