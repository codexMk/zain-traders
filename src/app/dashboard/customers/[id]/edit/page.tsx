"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CustomerForm from "@/components/forms/customer-form";

export default function EditCustomerPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await fetch(`/api/customers/${id}`);
        if (!response.ok) {
          setError("Customer not found");
          return;
        }
        const data = await response.json();
        setCustomer(data);
      } catch {
        setError("Failed to load customer");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomer();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-r-emerald-600"></div>
          <p className="mt-4 text-gray-600">Loading customer...</p>
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

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-600">Customer not found</div>
      </div>
    );
  }

  return <CustomerForm initialData={customer} isEditing={true} />;
}
