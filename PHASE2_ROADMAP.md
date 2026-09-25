# Phase 2 Roadmap - Core Modules Implementation

## Overview
Phase 1 foundation is complete! This document outlines the next steps for building the core modules of the Zain Traders ERP system.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start PostgreSQL  
docker-compose up -d

# 3. Setup database
npx prisma db push

# 4. Seed sample data
npm run seed

# 5. Start development
npm run dev
```

Then visit: http://localhost:3000/register to create your account

---

## Phase 2: Core Modules (Next)

### Module 1: Product Management (Priority 1)
**Status**: UI Pages Ready, Need Forms

#### What's Needed
- [ ] Create product form page (`/products/new`)
- [ ] Edit product form page (`/products/[id]/edit`)
- [ ] Product detail page with stock history
- [ ] Bulk product import
- [ ] Stock adjustment interface
- [ ] Category management

#### Existing API
```
GET /api/products              # List all
POST /api/products             # Create
GET /api/products/[id]         # Get detail
PUT /api/products/[id]         # Update
DELETE /api/products/[id]      # Delete
```

#### Key Files to Create
```
src/app/dashboard/products/new/page.tsx
src/app/dashboard/products/[id]/page.tsx
src/app/dashboard/products/[id]/edit/page.tsx
src/components/forms/ProductForm.tsx
```

---

### Module 2: Supplier Management (Priority 2)
**Status**: UI Pages Ready, Need Forms

#### What's Needed
- [ ] Create supplier form
- [ ] Edit supplier form
- [ ] Supplier detail page with purchase history
- [ ] Supplier ledger & payment tracking
- [ ] Rating system
- [ ] Purchase history

#### Existing API
```
GET /api/suppliers             # List all
POST /api/suppliers            # Create
GET /api/suppliers/[id]        # Get detail
PUT /api/suppliers/[id]        # Update
DELETE /api/suppliers/[id]     # Delete
```

#### New API Needed
```
POST /api/suppliers/[id]/payments  # Add payment
GET /api/suppliers/[id]/history    # Purchase history
```

---

### Module 3: Customer Management (Priority 3)
**Status**: Placeholder Page, Needs Full Implementation

#### What's Needed
- [ ] Create customer form
- [ ] Edit customer form
- [ ] Customer ledger page
- [ ] Payment history
- [ ] Outstanding tracking
- [ ] Credit limit management

#### Existing API
```
GET /api/customers             # List all
POST /api/customers            # Create
GET /api/customers/[id]        # Get detail
PUT /api/customers/[id]        # Update
DELETE /api/customers/[id]     # Delete
```

#### New API Needed
```
POST /api/customers/[id]/payments   # Add payment
GET /api/customers/[id]/invoices    # Invoice history
GET /api/customers/[id]/ledger      # Customer ledger
```

---

### Module 4: Purchase Management (Priority 4)
**Status**: API Ready, Needs UI

#### What's Needed
- [ ] Purchase order form
- [ ] Add line items dynamically
- [ ] Supplier and product selection
- [ ] Cost calculations
- [ ] Purchase list page
- [ ] Purchase detail page

#### New API Needed
```
POST /api/purchases            # Create purchase
GET /api/purchases             # List all
GET /api/purchases/[id]        # Get detail
PUT /api/purchases/[id]        # Update
POST /api/purchases/[id]/payments  # Add payment
```

#### Example Form Structure
```
- Supplier selection
- Add items (Product, Qty, Rate, GST)
- Transport cost
- Loading cost
- Auto GST calculation
- Total calculation
```

---

### Module 5: Billing/Invoice System (Priority 5)
**Status**: API Partially Ready, Needs UI & Enhancement

#### What's Needed
- [ ] Invoice creation form
- [ ] Add line items
- [ ] Customer selection
- [ ] Discount management
- [ ] GST calculation
- [ ] PDF generation
- [ ] Print functionality
- [ ] Payment tracking

#### New API Needed
```
POST /api/invoices/[id]/send   # Send invoice
POST /api/invoices/[id]/pdf    # Generate PDF
POST /api/invoices/[id]/print  # Print
PUT /api/invoices/[id]/status  # Update status
```

---

## Implementation Tips

### For Each Form Component

1. **Create a reusable form component** in `src/components/forms/`
   ```tsx
   // Example: ProductForm.tsx
   export function ProductForm({
     initialData?: Product
     onSubmit: (data: Product) => Promise<void>
   })
   ```

2. **Use React Hook Form** with Zod validation
   ```tsx
   const form = useForm<ProductSchema>({
     resolver: zodResolver(productSchema),
   })
   ```

3. **Show loading states**
   ```tsx
   <button disabled={form.formState.isSubmitting}>
     {form.formState.isSubmitting ? "Saving..." : "Save"}
   </button>
   ```

4. **Handle success/error feedback**
   ```tsx
   toast.success("Product created!")
   // or
   toast.error("Failed to create product")
   ```

### Recommended Order

1. Start with **Product Management** (simplest)
2. Then **Supplier Management** (similar pattern)
3. Then **Customer Management** (adds payment logic)
4. Then **Purchase Management** (complex)
5. Finally **Billing** (most complex)

---

## Database Relationships Reference

```
Product ←→ StockMovement
Product ←→ RateHistory
Product ←→ InvoiceItem
Product ←→ PurchaseItem

Supplier ←→ Purchase
Supplier ←→ SupplierPayment

Customer ←→ Invoice
Customer ←→ CustomerPayment
Customer ←→ Ledger

Purchase ←→ PurchaseItem
Purchase ←→ SupplierPayment

Invoice ←→ InvoiceItem
Invoice ←→ CustomerPayment
```

---

## Available Helper Functions

Check `src/lib/utils.ts` for:
- `formatCurrency()` - Format money
- `formatDate()` - Format dates
- `calculateGST()` - GST calculations
- `calculateTotal()` - With GST
- `formatNumber()` - Indian number format
- `isValidPhone()` - Phone validation
- `isValidGST()` - GST validation
- `generateInvoiceNumber()` - Invoice IDs
- `calculateOutstanding()` - Payment tracking

---

## Testing Checklist

### For Each Module
- [ ] Create new items
- [ ] Edit existing items
- [ ] Delete items
- [ ] Search/filter items
- [ ] Validate required fields
- [ ] Handle API errors
- [ ] Mobile responsive
- [ ] Dark/light theme compatible

---

## Sample Data Available

After running `npm run seed`:

**Users**:
- owner@zaintraders.com / password123
- staff@zaintraders.com / password123
- accountant@zaintraders.com / password123

**Products** (4 sample spices with stock):
- Jeera (200 units)
- Dhana (150 units)
- Kali Miri (100 units)
- Elaichi (80 units)

**Suppliers** (2 sample):
- Mumbai Spice Co.
- Pune Traders

**Customers** (2 sample):
- ABC Traders
- XYZ Wholesale

---

## File Template

Use this for new module pages:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

interface Module {
  id: string;
  name: string;
  // add other fields
}

export default function ModulePage() {
  const [items, setItems] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch("/api/module");
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header and content */}
    </div>
  );
}
```

---

## Next Steps

1. **Pick a module** to start (recommend: Products)
2. **Create the form component** with validation
3. **Create the page files** (new, edit, detail)
4. **Test with sample data**
5. **Move to next module**

---

## Questions or Blocked?

Review:
- Database schema: `prisma/schema.prisma`
- API routes: `src/app/api/*/route.ts`
- Dashboard layout: `src/app/dashboard/layout.tsx`
- Utility functions: `src/lib/utils.ts`
- Sample page: `src/app/dashboard/products/page.tsx`

---

**Happy Building! 🚀**
