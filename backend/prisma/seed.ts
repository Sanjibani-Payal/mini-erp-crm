import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clean existing data
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users for all 4 Roles
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@company.com',
      password: defaultPassword,
      role: 'ADMIN',
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sales Manager',
      email: 'sales@company.com',
      password: defaultPassword,
      role: 'SALES',
    },
  });

  const warehouse = await prisma.user.create({
    data: {
      name: 'Warehouse Supervisor',
      email: 'warehouse@company.com',
      password: defaultPassword,
      role: 'WAREHOUSE',
    },
  });

  const accounts = await prisma.user.create({
    data: {
      name: 'Accounts Executive',
      email: 'accounts@company.com',
      password: defaultPassword,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Created default users: Admin, Sales, Warehouse, Accounts');

  // 3. Seed Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Rahul Sharma',
      mobile: '+919876543210',
      email: 'rahul@apexretail.com',
      businessName: 'Apex Retail Store',
      gstNumber: '07AAAAA0000A1Z5',
      customerType: 'Retail',
      address: 'Shop 12, Main Market, Connaught Place, New Delhi',
      status: 'Active',
      followUpDate: new Date('2026-09-10'),
      notes: 'Interested in buying bulk electronics for Diwali sale.',
      followUps: {
        create: [
          {
            note: 'Initial inquiry for bulk prices sent via email.',
            createdBy: sales.name,
          },
          {
            note: 'Phone call done. Agreed to review product catalog.',
            createdBy: sales.name,
          },
        ],
      },
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Priya Verma',
      mobile: '+919812345678',
      email: 'priya@metrodistributors.com',
      businessName: 'Metro Distributors',
      gstNumber: '27BBBBB1111B2Z8',
      customerType: 'Distributor',
      address: 'Plot 45, Industrial Area Phase 2, Mumbai',
      status: 'Active',
      followUpDate: new Date('2026-09-05'),
      notes: 'Key distributor for West Zone.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Amit Patel',
      mobile: '+919711223344',
      email: 'amit@patelwholesale.com',
      businessName: 'Patel Wholesale Traders',
      gstNumber: '24CCCCC2222C3Z2',
      customerType: 'Wholesale',
      address: '102 Ring Road Market, Ahmedabad',
      status: 'Lead',
      followUpDate: new Date('2026-09-03'),
      notes: 'Requested sample catalog and wholesale pricing slab.',
    },
  });

  console.log('✅ Seeded 3 Customers with follow-ups');

  // 4. Seed Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Wireless Ergonomic Mouse',
      sku: 'SKU-LOG-WM01',
      category: 'Electronics',
      unitPrice: 1250,
      currentStock: 50,
      minStockAlert: 10,
      location: 'Rack A-12',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Mechanical Gaming Keyboard',
      sku: 'SKU-LOG-MK02',
      category: 'Electronics',
      unitPrice: 3499,
      currentStock: 25,
      minStockAlert: 5,
      location: 'Rack A-15',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: '27-inch 4K Monitor',
      sku: 'SKU-DISP-4K27',
      category: 'Monitors',
      unitPrice: 24999,
      currentStock: 3, // Low stock alert! (minStockAlert is 5)
      minStockAlert: 5,
      location: 'Rack B-04',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'USB-C Multi-Port Hub',
      sku: 'SKU-ACC-HUB08',
      category: 'Accessories',
      unitPrice: 1850,
      currentStock: 80,
      minStockAlert: 15,
      location: 'Rack C-01',
    },
  });

  console.log('✅ Seeded Products (including 1 low stock item alert)');

  // 5. Seed Stock Movements
  await prisma.stockMovement.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChanged: 50,
        movementType: 'IN',
        reason: 'Initial shipment arrival from vendor',
        createdBy: warehouse.name,
      },
      {
        productId: prod2.id,
        quantityChanged: 30,
        movementType: 'IN',
        reason: 'Stock purchase order PO-102',
        createdBy: warehouse.name,
      },
      {
        productId: prod3.id,
        quantityChanged: 10,
        movementType: 'IN',
        reason: 'Vendor Delivery',
        createdBy: warehouse.name,
      },
    ],
  });

  console.log('✅ Seeded initial Stock Movements');

  // 6. Seed Sales Challans
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260902-0001',
      customerId: customer1.id,
      totalQuantity: 5,
      totalAmount: 1250 * 5,
      status: 'Confirmed',
      createdBy: sales.name,
      items: {
        create: [
          {
            productId: prod1.id,
            productNameSnapshot: prod1.name,
            skuSnapshot: prod1.sku,
            unitPriceSnapshot: prod1.unitPrice,
            quantity: 5,
            subtotal: 1250 * 5,
          },
        ],
      },
    },
  });

  // Record stock reduction for confirmed challan
  await prisma.stockMovement.create({
    data: {
      productId: prod1.id,
      quantityChanged: 5,
      movementType: 'OUT',
      reason: 'Sales Challan CH-20260902-0001 confirmed',
      createdBy: sales.name,
    },
  });

  const challan2 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-20260902-0002',
      customerId: customer2.id,
      totalQuantity: 2,
      totalAmount: 24999 * 2,
      status: 'Draft',
      createdBy: sales.name,
      items: {
        create: [
          {
            productId: prod3.id,
            productNameSnapshot: prod3.name,
            skuSnapshot: prod3.sku,
            unitPriceSnapshot: prod3.unitPrice,
            quantity: 2,
            subtotal: 24999 * 2,
          },
        ],
      },
    },
  });

  console.log('✅ Seeded Sales Challans (1 Confirmed, 1 Draft)');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
