import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

const categories = [
  { slug: "WHOLE_SPICES", name: "Whole Spices", nameMarathi: "खडे मसाले" },
  { slug: "POWDER_SPICES", name: "Powder Spices", nameMarathi: "पावडर मसाले" },
  { slug: "DRY_FRUITS", name: "Dry Fruits", nameMarathi: "ड्राय फ्रूट्स" },
  { slug: "SEEDS", name: "Seeds", nameMarathi: "बियाणे" },
];

const sampleProducts = [
  { name: "Cumin Seeds", marathiName: "जिरे", sku: "JEERA-001", category: "WHOLE_SPICES", purchaseRate: 450, sellingRate: 550, stock: 200, min: 50, hsn: "0908.10" },
  { name: "Coriander Seeds", marathiName: "धणे", sku: "DHANE-001", category: "WHOLE_SPICES", purchaseRate: 380, sellingRate: 480, stock: 150, min: 50, hsn: "0909.10" },
  { name: "Cloves", marathiName: "लवंग", sku: "LAVANG-001", category: "WHOLE_SPICES", purchaseRate: 900, sellingRate: 1100, stock: 80, min: 20, hsn: "0907.10" },
  { name: "Black Pepper", marathiName: "काळी मिरी", sku: "KALI-MIRI-001", category: "WHOLE_SPICES", purchaseRate: 650, sellingRate: 800, stock: 100, min: 30, hsn: "0904.20" },
  { name: "Cinnamon", marathiName: "दालचिनी", sku: "DALCHINI-001", category: "WHOLE_SPICES", purchaseRate: 420, sellingRate: 520, stock: 120, min: 25, hsn: "0906.11" },
  { name: "Green Cardamom", marathiName: "वेलची", sku: "VELCHI-001", category: "WHOLE_SPICES", purchaseRate: 1200, sellingRate: 1500, stock: 80, min: 20, hsn: "0908.31" },
  { name: "Cashew W320", marathiName: "W320 काजू", sku: "KAJU-W320-001", category: "DRY_FRUITS", purchaseRate: 850, sellingRate: 980, stock: 60, min: 15, hsn: "0801.32" },
  { name: "Almond", marathiName: "बदाम", sku: "BADAM-001", category: "DRY_FRUITS", purchaseRate: 720, sellingRate: 850, stock: 70, min: 15, hsn: "0802.11" },
  { name: "Pistachio", marathiName: "पिस्ता", sku: "PISTA-001", category: "DRY_FRUITS", purchaseRate: 1100, sellingRate: 1300, stock: 45, min: 10, hsn: "0802.51" },
];

async function main() {
  console.log("🌱 Starting database seed...");

  await prisma.customerPayment.deleteMany();
  await prisma.supplierPayment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.purchaseItem.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.rateHistory.deleteMany();
  await prisma.ledger.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

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

  const staff = await prisma.user.create({
    data: {
      email: "staff@zaintraders.com",
      password: await hash("password123", 10),
      name: "Staff Member",
      phone: "9021276946",
      role: "STAFF",
      isActive: true,
    },
  });

  console.log("✅ Users created:", owner.email, staff.email);

  const categoryRecords = await Promise.all(
    categories.map((cat) =>
      prisma.category.create({
        data: cat,
      })
    )
  );

  const categoryMap = Object.fromEntries(
    categoryRecords.map((c) => [c.slug, c.id])
  );

  console.log(`✅ ${categoryRecords.length} categories created`);

  const products = await Promise.all(
    sampleProducts.map((p) =>
      prisma.product.create({
        data: {
          name: p.name,
          marathiName: p.marathiName,
          sku: p.sku,
          categoryId: categoryMap[p.category],
          unit: "KG",
          hsnCode: p.hsn,
          gstPercentage: 5,
          purchaseRate: p.purchaseRate,
          sellingRate: p.sellingRate,
          minimumStockLevel: p.min,
          currentStock: p.stock,
        },
      })
    )
  );

  console.log(`✅ ${products.length} products created`);

  await Promise.all(
    products.map((product) =>
      prisma.stockMovement.create({
        data: {
          productId: product.id,
          movementType: "STOCK_IN",
          quantity: product.currentStock,
          referenceType: "SEED",
          notes: "Initial stock from seed",
        },
      })
    )
  );

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
        productCategories: ["WHOLE_SPICES", "DRY_FRUITS"],
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

  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "ABC Traders",
        mobile: "9111222333",
        address: "Pune, Maharashtra",
        gstNumber: "27AABCT1234H2Z5",
        creditLimit: 50000,
      },
    }),
    prisma.customer.create({
      data: {
        name: "XYZ Wholesale",
        mobile: "9222333444",
        address: "Mumbai, Maharashtra",
        gstNumber: "27AAACR1234H2Z5",
        creditLimit: 75000,
      },
    }),
  ]);

  console.log(`✅ ${suppliers.length} suppliers, ${customers.length} customers created`);
  console.log("🎉 Seed completed successfully!");
  console.log("\nLogin credentials:");
  console.log("  Owner: owner@zaintraders.com / password123");
  console.log("  Staff: staff@zaintraders.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
