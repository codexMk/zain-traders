"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PurchaseForm from "@/components/forms/purchase-form";

export default function EditPurchasePage() {
  const params = useParams();
  const id = params.id as string;
  const [purchase, setPurchase] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await fetch(`/api/purchases/${id}`);
        if (!response.ok) {
          setError("Purchase order not found");
          return;
        }
        const data = await response.json();
        setPurchase(data);
      } catch {
        setError("Failed to load purchase order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-r-emerald-600"></div>
          <p className="mt-4 text-gray-600">Loading purchase order...</p>
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

  if (!purchase) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">Purchase order not found</div>
      </div>
    );
  }

  return <PurchaseForm initialData={purchase} isEditing={true} />;
}
