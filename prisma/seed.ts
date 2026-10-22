import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  console.log("🌱 Starting database seed...");

  // Create Owner
  const owner = await prisma.user.create({
    data: {
      email: "owner@zaintraders.com",
      password: await hash("password123", 10),
      name: "Owner",
      phone: "9307427731",
      role: "OWNER",
      isActive: true,
    },
  });
  console.log("✅ Owner created:", owner.email);

  // Create Staff
  const staff = await prisma.user.create({
    data: {
      email: "staff@zaintraders.com",
      password: await hash("password123", 10),
      name: "Staff Member",
      phone: "8856915606",
      role: "STAFF",
      isActive: true,
    },
  });
  console.log("✅ Staff created:", staff.email);

  // Create Accountant
  const accountant = await prisma.user.create({
    data: {
      email: "accountant@zaintraders.com",
      password: await hash("password123", 10),
      name: "Accountant",
      phone: "9876543210",
      role: "ACCOUNTANT",
      isActive: true,
    },
  });
  console.log("✅ Accountant created:", accountant.email);

  const categories = await Promise.all([
    { name: "Whole Spices", slug: "whole-spices" },
    { name: "Powder Spices", slug: "powder-spices" },
    { name: "Dry Fruits", slug: "dry-fruits" },
    { name: "Other Products", slug: "other-products" },
  ].map(({ name, slug }) => prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { name, slug },
  })));
  const wholeSpices = categories[0];

  // Create Sample Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: "Jeera",
        marathiName: "जिरा",
        sku: "JEERA-001",
        categoryId: wholeSpices.id,
        unit: "KG",
        hsnCode: "0908.10",
        gstPercentage: 5,
        purchaseRate: 450,
        sellingRate: 550,
        minimumStockLevel: 50,
        currentStock: 200,
      },
    }),
    prisma.product.create({
      data: {
        name: "Dhana",
        marathiName: "धना",
        sku: "DHANA-001",
        categoryId: wholeSpices.id,
        unit: "KG",
        hsnCode: "0909.10",
        gstPercentage: 5,
        purchaseRate: 380,
        sellingRate: 480,
        minimumStockLevel: 50,
        currentStock: 150,
      },
    }),
    prisma.product.create({
      data: {
        name: "Kali Miri",
        marathiName: "काळी मिरी",
        sku: "KALI-MIRI-001",
        categoryId: wholeSpices.id,
        unit: "KG",
        hsnCode: "0904.20",
        gstPercentage: 5,
        purchaseRate: 650,
        sellingRate: 800,
        minimumStockLevel: 30,
        currentStock: 100,
      },
    }),
    prisma.product.create({
      data: {
        name: "Elaichi",
        marathiName: "एलाईची",
        sku: "ELAICHI-001",
        categoryId: wholeSpices.id,
        unit: "KG",
        hsnCode: "0908.30",
        gstPercentage: 5,
        purchaseRate: 1200,
        sellingRate: 1500,
        minimumStockLevel: 20,
        currentStock: 80,
      },
    }),
  ]);
  console.log(`✅ ${products.length} products created`);

  // Create Sample Suppliers
  const suppliers = await Promise.all([
    prisma.supplier.create({
      data: {
        name: "Mumbai Spice Co.",
        contactPerson: "Raj Patel",
        mobile: "9988776655",
        whatsapp: "9988776655",
        city: "Mumbai",
        address: "123, Spice Market, Mumbai",
        gstNumber: "27AAACR1234H2Z5",
        productCategories: ["WHOLE_SPICES", "POWDER_SPICES"],
        rating: 4.5,
      },
    }),
    prisma.supplier.create({
      data: {
        name: "Pune Traders",
        contactPerson: "Vikram Sharma",
        mobile: "9876543210",
        whatsapp: "9876543210",
        city: "Pune",
        address: "456, Market Yard, Pune",
        gstNumber: "27AABCT1234H2Z5",
        productCategories: ["DRY_FRUITS", "WHOLE_SPICES"],
        rating: 4.2,
      },
    }),
  ]);
  console.log(`✅ ${suppliers.length} suppliers created`);

  // Create Sample Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "ABC Traders",
        mobile: "9111222333",
        address: "Pune",
        gstNumber: "27AABCT1234H2Z5",
        creditLimit: 50000,
      },
    }),
    prisma.customer.create({
      data: {
        name: "XYZ Wholesale",
        mobile: "9222333444",
        address: "Mumbai",
        gstNumber: "27AAACR1234H2Z5",
        creditLimit: 75000,
      },
    }),
  ]);
  console.log(`✅ ${customers.length} customers created`);

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
