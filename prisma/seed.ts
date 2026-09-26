import { prisma } from '@/lib/prisma'
import { Role, ProductStatus, TableStatus, PaymentMethod } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

async function main() {
  console.log('🌱 Seeding database...')

  // 1. AppConfig - venue settings
  await prisma.appConfig.upsert({
    where: { id: 'singapore-club-config' },
    update: {},
    create: {
      id: 'singapore-club-config',
      venueName: 'Singapore Club',
      initialAdminId: '', // Will be set when first admin signs up
    },
  })

  // 2. AppSetting - key-value config
  const settings = [
    { key: 'venueName', value: 'Singapore Club' },
    { key: 'currency', value: 'KES' },
    { key: 'timezone', value: 'Africa/Nairobi' },
    { key: 'receiptFooter', value: 'Thank you for visiting Singapore Club!' },
    { key: 'lowStockAlertThreshold', value: '10' },
    { key: 'autoCloseShiftAtMidnight', value: 'false' },
  ]

  for (const s of settings) {
    await prisma.appSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    })
  }

  // 3. Categories
  const categories = [
    { name: 'Beer' },
    { name: 'Wine' },
    { name: 'Spirits' },
    { name: 'Cocktails' },
    { name: 'Soft Drinks' },
    { name: 'Food' },
    { name: 'Pool' },
  ]

  const createdCategories: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    })
    createdCategories[cat.name] = created.id
  }

  // 4. Products
  const products = [
    // Beer
    { name: 'Tusker Lager', sku: 'BEER-001', category: 'Beer', price: 250, costPrice: 150, stock: 100, reorderAt: 20 },
    { name: 'White Cap', sku: 'BEER-002', category: 'Beer', price: 220, costPrice: 130, stock: 80, reorderAt: 15 },
    { name: 'Heineken', sku: 'BEER-003', category: 'Beer', price: 300, costPrice: 180, stock: 50, reorderAt: 10 },
    { name: 'Guinness', sku: 'BEER-004', category: 'Beer', price: 280, costPrice: 170, stock: 40, reorderAt: 10 },
    { name: 'Tusker Cider', sku: 'BEER-005', category: 'Beer', price: 260, costPrice: 160, stock: 60, reorderAt: 15 },

    // Wine
    { name: 'House Red Wine', sku: 'WINE-001', category: 'Wine', price: 450, costPrice: 280, stock: 30, reorderAt: 5 },
    { name: 'House White Wine', sku: 'WINE-002', category: 'Wine', price: 450, costPrice: 280, stock: 30, reorderAt: 5 },
    { name: 'Sauvignon Blanc', sku: 'WINE-003', category: 'Wine', price: 550, costPrice: 350, stock: 20, reorderAt: 5 },

    // Spirits
    { name: 'Johnnie Walker Red', sku: 'SPR-001', category: 'Spirits', price: 450, costPrice: 300, stock: 25, reorderAt: 5 },
    { name: 'Jack Daniels', sku: 'SPR-002', category: 'Spirits', price: 400, costPrice: 260, stock: 20, reorderAt: 5 },
    { name: 'Smirnoff Vodka', sku: 'SPR-003', category: 'Spirits', price: 300, costPrice: 180, stock: 30, reorderAt: 8 },
    { name: 'Bacardi White Rum', sku: 'SPR-004', category: 'Spirits', price: 320, costPrice: 200, stock: 25, reorderAt: 5 },
    { name: 'Gordon Gin', sku: 'SPR-005', category: 'Spirits', price: 280, costPrice: 170, stock: 20, reorderAt: 5 },

    // Cocktails
    { name: 'Mojito', sku: 'COCK-001', category: 'Cocktails', price: 350, costPrice: 120, stock: 999, reorderAt: 0 },
    { name: 'Margarita', sku: 'COCK-002', category: 'Cocktails', price: 350, costPrice: 130, stock: 999, reorderAt: 0 },
    { name: 'Old Fashioned', sku: 'COCK-003', category: 'Cocktails', price: 400, costPrice: 150, stock: 999, reorderAt: 0 },
    { name: 'Whiskey Sour', sku: 'COCK-004', category: 'Cocktails', price: 380, costPrice: 140, stock: 999, reorderAt: 0 },

    // Soft Drinks
    { name: 'Coca Cola', sku: 'SODA-001', category: 'Soft Drinks', price: 100, costPrice: 50, stock: 100, reorderAt: 20 },
    { name: 'Sprite', sku: 'SODA-002', category: 'Soft Drinks', price: 100, costPrice: 50, stock: 100, reorderAt: 20 },
    { name: 'Fanta Orange', sku: 'SODA-003', category: 'Soft Drinks', price: 100, costPrice: 50, stock: 80, reorderAt: 15 },
    { name: 'Soda Water', sku: 'SODA-004', category: 'Soft Drinks', price: 80, costPrice: 40, stock: 60, reorderAt: 10 },
    { name: 'Tonic Water', sku: 'SODA-005', category: 'Soft Drinks', price: 100, costPrice: 55, stock: 50, reorderAt: 10 },
    { name: 'Red Bull', sku: 'SODA-006', category: 'Soft Drinks', price: 250, costPrice: 150, stock: 30, reorderAt: 5 },

    // Food
    { name: 'Beef Burger', sku: 'FOOD-001', category: 'Food', price: 450, costPrice: 200, stock: 30, reorderAt: 5 },
    { name: 'Chicken Wings (6pc)', sku: 'FOOD-002', category: 'Food', price: 380, costPrice: 160, stock: 25, reorderAt: 5 },
    { name: 'Fish & Chips', sku: 'FOOD-003', category: 'Food', price: 420, costPrice: 180, stock: 20, reorderAt: 5 },
    { name: 'French Fries', sku: 'FOOD-004', category: 'Food', price: 150, costPrice: 50, stock: 50, reorderAt: 10 },
    { name: 'Onion Rings', sku: 'FOOD-005', category: 'Food', price: 180, costPrice: 70, stock: 40, reorderAt: 8 },
    { name: 'Caesar Salad', sku: 'FOOD-006', category: 'Food', price: 320, costPrice: 120, stock: 15, reorderAt: 3 },

    // Pool
    { name: 'Pool Table - 30 min', sku: 'POOL-001', category: 'Pool', price: 200, costPrice: 0, stock: 999, reorderAt: 0 },
    { name: 'Pool Table - 1 hour', sku: 'POOL-002', category: 'Pool', price: 350, costPrice: 0, stock: 999, reorderAt: 0 },
  ]

  for (const prod of products) {
    await prisma.product.upsert({
      where: { sku: prod.sku },
      update: {},
      create: {
        name: prod.name,
        sku: prod.sku,
        categoryId: createdCategories[prod.category]!,
        price: new Decimal(prod.price),
        costPrice: new Decimal(prod.costPrice),
        stock: new Decimal(prod.stock),
        reorderAt: new Decimal(prod.reorderAt),
        status: ProductStatus.ACTIVE,
      },
    })
  }

  // 5. Venue Tables
  const tables = [
    { name: 'Table 1', capacity: 4, status: TableStatus.AVAILABLE },
    { name: 'Table 2', capacity: 4, status: TableStatus.AVAILABLE },
    { name: 'Table 3', capacity: 6, status: TableStatus.AVAILABLE },
    { name: 'Table 4', capacity: 6, status: TableStatus.AVAILABLE },
    { name: 'Table 5', capacity: 8, status: TableStatus.AVAILABLE },
    { name: 'Table 6', capacity: 4, status: TableStatus.AVAILABLE },
    { name: 'VIP 1', capacity: 10, status: TableStatus.AVAILABLE },
    { name: 'VIP 2', capacity: 10, status: TableStatus.AVAILABLE },
    { name: 'Bar 1', capacity: 2, status: TableStatus.AVAILABLE },
    { name: 'Bar 2', capacity: 2, status: TableStatus.AVAILABLE },
    { name: 'Pool 1', capacity: 4, status: TableStatus.AVAILABLE },
    { name: 'Pool 2', capacity: 4, status: TableStatus.AVAILABLE },
  ]

  for (const table of tables) {
    await prisma.venueTable.upsert({
      where: { name: table.name },
      update: {},
      create: table,
    })
  }

  // 6. Tax Rules
  const taxRules = [
    { name: 'VAT 16%', rate: 16.00, active: true },
    { name: 'Service Charge 10%', rate: 10.00, active: true },
  ]

  for (const tax of taxRules) {
    await prisma.taxRule.upsert({
      where: { name: tax.name },
      update: {},
      create: tax,
    })
  }

  // 7. Discount Rules
  const discounts = [
    { name: 'Happy Hour 20%', percentage: 20.00, active: true },
    { name: 'Ladies Night 15%', percentage: 15.00, active: true },
    { name: 'Student Discount 10%', percentage: 10.00, active: true },
    { name: 'Staff Discount 50%', percentage: 50.00, active: true },
  ]

  for (const d of discounts) {
    await prisma.discountRule.upsert({
      where: { name: d.name },
      update: {},
      create: d,
    })
  }

  // 8. Printer Configs
  const printers = [
    { name: 'Kitchen Printer', endpoint: 'http://192.168.1.100:9100', active: true },
    { name: 'Bar Printer', endpoint: 'http://192.168.1.101:9100', active: true },
    { name: 'Receipt Printer', endpoint: 'http://192.168.1.102:9100', active: true },
  ]

  for (const p of printers) {
    const existing = await prisma.printerConfig.findFirst({ where: { name: p.name } })
    if (!existing) {
      await prisma.printerConfig.create({ data: p })
    }
  }

  // 9. Role Catalog (for UI display)
  const roles = [
    { role: Role.ADMIN, label: 'General Manager', description: 'Full system access, manage staff, settings, reports' },
    { role: Role.MANAGER, label: 'Manager', description: 'Manage operations, staff, inventory, reports' },
    { role: Role.CASHIER, label: 'Cashier', description: 'Process orders, payments, manage tables' },
    { role: Role.BARTENDER, label: 'Bartender', description: 'Prepare drinks, manage bar inventory' },
    { role: Role.WAITER, label: 'Waiter', description: 'Take orders, serve tables' },
    { role: Role.INVENTORY_MANAGER, label: 'Inventory Manager', description: 'Manage stock, products, suppliers' },
  ]

  for (const r of roles) {
    await prisma.roleCatalog.upsert({
      where: { role: r.role },
      update: { label: r.label, description: r.description },
      create: r,
    })
  }

  console.log('✅ Seeding complete!')
  console.log(`
  Seeded:
  - AppConfig & AppSettings
  - ${categories.length} categories
  - ${products.length} products
  - ${tables.length} venue tables
  - ${taxRules.length} tax rules
  - ${discounts.length} discount rules
  - ${printers.length} printer configs
  - ${roles.length} role catalog entries
  `)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })